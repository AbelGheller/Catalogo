/*
  # Adicionar função RPC e dados de teste

  1. Função RPC para anexar filhos com auto-flip
    - Permite anexar Peça -> Kit (inverte automaticamente para Kit -> Peça)
    - Valida matriz de pertencimento
    - Registra logs de auditoria

  2. Dados de teste
    - Equipamentos diversos (empilhadeiras, escavadeiras, etc.)
    - Conjuntos (motores, bombas, sistemas)
    - Partes (chassis, transmissões, etc.)
    - Peças (pistões, anéis, juntas, etc.)
    - Kits (conjuntos de peças relacionadas)
    - Relacionamentos hierárquicos
*/

BEGIN;

-- Enum para níveis (caso não exista)
DO $$ BEGIN
    CREATE TYPE item_level_enum AS ENUM ('Equipamento','Conjunto','Parte','Peça','Kit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Função para verificar se containment é permitido
CREATE OR REPLACE FUNCTION public.is_allowed_containment(parent_level item_level_enum, child_level item_level_enum)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN parent_level = 'Equipamento' AND child_level IN ('Conjunto', 'Parte', 'Kit') THEN true
    WHEN parent_level = 'Conjunto' AND child_level IN ('Parte', 'Peça', 'Kit') THEN true
    WHEN parent_level = 'Parte' AND child_level IN ('Peça', 'Kit') THEN true
    WHEN parent_level = 'Kit' AND child_level IN ('Peça', 'Parte') THEN true
    WHEN parent_level = 'Peça' THEN false -- Peça não pode conter nada
    ELSE false
  END;
$$;

-- Remover versão antiga
DROP FUNCTION IF EXISTS public.rpc_attach_child_auto(text, text, text);

-- Helpers (seguros caso já existam)
CREATE OR REPLACE FUNCTION public._get_id_by_code(p_code text)
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT i.id FROM public.catalog_items i WHERE i.code = p_code LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public._get_level_by_code(p_code text)
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT i.level FROM public.catalog_items i WHERE i.code = p_code LIMIT 1
$$;

-- Versão corrigida da função RPC
CREATE OR REPLACE FUNCTION public.rpc_attach_child_auto(
  parent_code text,
  child_code  text,
  p_relation  text DEFAULT 'contains'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_id uuid := public._get_id_by_code(parent_code);
  c_id uuid := public._get_id_by_code(child_code);
  p_level text := public._get_level_by_code(parent_code);
  c_level text := public._get_level_by_code(child_code);

  flip boolean := false;

  eff_parent uuid;
  eff_child  uuid;
  eff_parent_code text;
  eff_child_code  text;

  v_relation text := COALESCE(p_relation, 'contains');
  has_audit boolean := false;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Parent code não encontrado (%).', parent_code;
  END IF;
  IF c_id IS NULL THEN
    RAISE EXCEPTION 'Child code não encontrado (%).', child_code;
  END IF;

  -- Caso especial: Peça -> Kit (inverter para Kit -> Peça)
  IF p_level = 'Peça' AND c_level = 'Kit' THEN
    flip := true;
  END IF;

  IF NOT flip THEN
    -- valida matriz normal usando função de validação
    IF NOT (
      (p_level = 'Equipamento' AND c_level IN ('Conjunto', 'Parte', 'Kit')) OR
      (p_level = 'Conjunto' AND c_level IN ('Parte', 'Peça', 'Kit')) OR
      (p_level = 'Parte' AND c_level IN ('Peça', 'Kit')) OR
      (p_level = 'Kit' AND c_level IN ('Peça', 'Parte'))
    ) THEN
      RAISE EXCEPTION 'Relation not allowed (matriz): % -> %', p_level, c_level;
    END IF;
    eff_parent := p_id;
    eff_child  := c_id;
    eff_parent_code := parent_code;
    eff_child_code  := child_code;
  ELSE
    -- flip para Kit -> Peça
    eff_parent := c_id;   -- Kit vira pai
    eff_child  := p_id;   -- Peça vira filho
    eff_parent_code := child_code;
    eff_child_code  := parent_code;
  END IF;

  -- Upsert da relação efetiva
  INSERT INTO public.catalog_item_relations(parent_id, child_id, relation)
  VALUES (eff_parent, eff_child, v_relation)
  ON CONFLICT (parent_id, child_id, relation) DO NOTHING;

  -- Checa se audit_logs existe e então grava
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'catalog_audit_logs'
  ) INTO has_audit;

  IF has_audit THEN
    INSERT INTO public.catalog_audit_logs(item_code, action, payload)
    VALUES (
      eff_parent_code,
      'attach_child_auto',
      jsonb_build_object(
        'requested_parent', parent_code,
        'requested_child',  child_code,
        'effective_parent', eff_parent_code,
        'effective_child',  eff_child_code,
        'flipped',          flip,
        'relation',         v_relation
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'status','ok',
    'message', CASE WHEN flip THEN 'relation upserted (flipped Peça->Kit to Kit->Peça)' ELSE 'relation upserted' END,
    'data', jsonb_build_object(
      'effective_parent', eff_parent_code,
      'effective_child',  eff_child_code,
      'flipped',          flip
    )
  );
END
$$;

-- Permissões de execução
GRANT EXECUTE ON FUNCTION public.rpc_attach_child_auto(text, text, text) TO anon, authenticated;

-- Limpar dados existentes para evitar conflitos
DELETE FROM catalog_item_relations;
DELETE FROM catalog_item_tags;
DELETE FROM catalog_items;
DELETE FROM catalog_tags;

-- Inserir dados de teste mais abrangentes

-- 1. EQUIPAMENTOS (máquinas completas)
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('EQP-001', 'Empilhadeira XGMA XG530F-DT25', 'Equipamento', '{"setor":"logistica","marca":"XGMA"}', '{"capacidade_kg":3000,"altura_elevacao_mm":3000}'),
('EQP-002', 'Escavadeira Hidráulica CAT 320D', 'Equipamento', '{"setor":"construcao","marca":"Caterpillar"}', '{"peso_operacional_kg":20500,"capacidade_balde_m3":1.2}'),
('EQP-003', 'Pá-carregadeira XCMG LW300FN', 'Equipamento', '{"setor":"construcao","marca":"XCMG"}', '{"capacidade_balde_m3":1.8,"potencia_kw":92}'),
('EQP-004', 'Retroescavadeira JCB 3CX', 'Equipamento', '{"setor":"construcao","marca":"JCB"}', '{"profundidade_escavacao_mm":4270,"altura_descarga_mm":2640}'),
('EQP-005', 'Motor Marítimo Yuchai YC6A230C', 'Equipamento', '{"ambiente":"naval","marca":"Yuchai"}', '{"potencia_kw":170,"cilindros":6,"aplicacao":"maritima"}');

-- 2. CONJUNTOS (sistemas/módulos)
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('CJT-001', 'Motor Diesel 4D80 Yuchai', 'Conjunto', '{"tipo":"motor","marca":"Yuchai"}', '{"potencia_kw":58,"cilindros":4,"combustivel":"diesel"}'),
('CJT-002', 'Transmissão Automática ZF 4WG200', 'Conjunto', '{"tipo":"transmissao","marca":"ZF"}', '{"marchas":4,"torque_max_nm":1200}'),
('CJT-003', 'Sistema Hidráulico Principal', 'Conjunto', '{"tipo":"hidraulico"}', '{"pressao_max_bar":350,"vazao_lpm":180}'),
('CJT-004', 'Bomba Injetora Bosch VE4/11F1900L024', 'Conjunto', '{"tipo":"bomba_injetora","marca":"Bosch"}', '{"cilindros":4,"rotacao_max_rpm":2400}'),
('CJT-005', 'Diferencial Traseiro Dana 212', 'Conjunto', '{"tipo":"diferencial","marca":"Dana"}', '{"relacao":4.11,"capacidade_oleo_l":3.5}');

-- 3. PARTES (componentes/subconjuntos)
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('PRT-001', 'Cabeçote do Motor 4D80', 'Parte', '{"componente":"cabecote"}', '{"material":"ferro_fundido","valvulas":8}'),
('PRT-002', 'Bloco do Motor 4D80', 'Parte', '{"componente":"bloco"}', '{"material":"ferro_fundido","cilindrada_l":2.977}'),
('PRT-003', 'Virabrequim 4D80', 'Parte', '{"componente":"virabrequim"}', '{"material":"aco_forjado","mancais":5}'),
('PRT-004', 'Chassis Principal Soldado', 'Parte', '{"componente":"chassis"}', '{"material":"aco_carbono","tratamento":"pintura_eletrostatica"}'),
('PRT-005', 'Eixo Dianteiro Completo', 'Parte', '{"componente":"eixo"}', '{"tipo":"direcional","capacidade_kg":6000}');

-- 4. PEÇAS (itens atômicos)
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('PEC-001', 'Pistão 4D80 STD', 'Peça', '{"componente":"pistao"}', '{"diametro_mm":95,"altura_mm":78,"material":"aluminio"}'),
('PEC-002', 'Anel de Pistão 1º Compressão', 'Peça', '{"componente":"anel"}', '{"diametro_mm":95,"espessura_mm":2.5,"posicao":"1_compressao"}'),
('PEC-003', 'Anel de Pistão 2º Compressão', 'Peça', '{"componente":"anel"}', '{"diametro_mm":95,"espessura_mm":2.0,"posicao":"2_compressao"}'),
('PEC-004', 'Anel Raspador de Óleo', 'Peça', '{"componente":"anel"}', '{"diametro_mm":95,"espessura_mm":3.0,"posicao":"raspador"}'),
('PEC-005', 'Junta do Cabeçote', 'Peça', '{"componente":"junta"}', '{"material":"metal_elastomero","espessura_mm":1.2}'),
('PEC-006', 'Válvula de Admissão', 'Peça', '{"componente":"valvula"}', '{"diametro_cabeca_mm":35,"tipo":"admissao"}'),
('PEC-007', 'Válvula de Escape', 'Peça', '{"componente":"valvula"}', '{"diametro_cabeca_mm":30,"tipo":"escape"}'),
('PEC-008', 'Bronzina de Biela STD', 'Peça', '{"componente":"bronzina"}', '{"tipo":"biela","medida":"std","material":"bimetal"}'),
('PEC-009', 'Bronzina de Mancal STD', 'Peça', '{"componente":"bronzina"}', '{"tipo":"mancal","medida":"std","material":"bimetal"}'),
('PEC-010', 'Filtro de Óleo Motor', 'Peça', '{"componente":"filtro"}', '{"tipo":"oleo","aplicacao":"motor"}');

-- 5. KITS (agrupamentos lógicos)
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('KIT-001', 'Kit Anéis de Pistão Completo', 'Kit', '{"tipo":"aneis"}', '{"cilindros":4,"conteudo":"aneis_1_2_compressao_raspador"}'),
('KIT-002', 'Kit Juntas Motor Superior', 'Kit', '{"tipo":"juntas"}', '{"aplicacao":"cabecote_superior"}'),
('KIT-003', 'Kit Bronzinas Completo', 'Kit', '{"tipo":"bronzinas"}', '{"conteudo":"biela_mancal_std"}'),
('KIT-004', 'Kit Válvulas Completo', 'Kit', '{"tipo":"valvulas"}', '{"conteudo":"admissao_escape_completo"}'),
('KIT-005', 'Kit Reparo Motor Básico', 'Kit', '{"tipo":"reparo_basico"}', '{"conteudo":"aneis_juntas_bronzinas"}');

-- Inserir tags
INSERT INTO catalog_tags (name, kind) VALUES
('XGMA', 'marca'),
('Caterpillar', 'marca'),
('XCMG', 'marca'),
('JCB', 'marca'),
('Yuchai', 'marca'),
('ZF', 'marca'),
('Bosch', 'marca'),
('Dana', 'marca'),
('empilhadeira', 'tipo_equipamento'),
('escavadeira', 'tipo_equipamento'),
('pa_carregadeira', 'tipo_equipamento'),
('retroescavadeira', 'tipo_equipamento'),
('motor', 'tipo_conjunto'),
('transmissao', 'tipo_conjunto'),
('hidraulico', 'tipo_conjunto'),
('bomba_injetora', 'tipo_conjunto'),
('diferencial', 'tipo_conjunto'),
('cabecote', 'componente'),
('bloco', 'componente'),
('virabrequim', 'componente'),
('chassis', 'componente'),
('eixo', 'componente'),
('pistao', 'peca'),
('anel', 'peca'),
('junta', 'peca'),
('valvula', 'peca'),
('bronzina', 'peca'),
('filtro', 'peca'),
('naval', 'contexto'),
('construcao', 'setor'),
('logistica', 'setor'),
('diesel', 'combustivel'),
('kit_aneis', 'tipo_kit'),
('kit_juntas', 'tipo_kit'),
('kit_bronzinas', 'tipo_kit'),
('kit_valvulas', 'tipo_kit'),
('reparo_basico', 'tipo_kit');

-- Vincular tags aos itens
INSERT INTO catalog_item_tags (item_id, tag_id)
SELECT i.id, t.id FROM catalog_items i, catalog_tags t 
WHERE 
  -- Equipamentos
  (i.code = 'EQP-001' AND t.name IN ('XGMA', 'empilhadeira', 'logistica')) OR
  (i.code = 'EQP-002' AND t.name IN ('Caterpillar', 'escavadeira', 'construcao')) OR
  (i.code = 'EQP-003' AND t.name IN ('XCMG', 'pa_carregadeira', 'construcao')) OR
  (i.code = 'EQP-004' AND t.name IN ('JCB', 'retroescavadeira', 'construcao')) OR
  (i.code = 'EQP-005' AND t.name IN ('Yuchai', 'motor', 'naval')) OR
  
  -- Conjuntos
  (i.code = 'CJT-001' AND t.name IN ('Yuchai', 'motor', 'diesel')) OR
  (i.code = 'CJT-002' AND t.name IN ('ZF', 'transmissao')) OR
  (i.code = 'CJT-003' AND t.name IN ('hidraulico')) OR
  (i.code = 'CJT-004' AND t.name IN ('Bosch', 'bomba_injetora', 'diesel')) OR
  (i.code = 'CJT-005' AND t.name IN ('Dana', 'diferencial')) OR
  
  -- Partes
  (i.code = 'PRT-001' AND t.name IN ('cabecote', 'motor')) OR
  (i.code = 'PRT-002' AND t.name IN ('bloco', 'motor')) OR
  (i.code = 'PRT-003' AND t.name IN ('virabrequim', 'motor')) OR
  (i.code = 'PRT-004' AND t.name IN ('chassis')) OR
  (i.code = 'PRT-005' AND t.name IN ('eixo')) OR
  
  -- Peças
  (i.code = 'PEC-001' AND t.name IN ('pistao', 'motor')) OR
  (i.code = 'PEC-002' AND t.name IN ('anel', 'pistao')) OR
  (i.code = 'PEC-003' AND t.name IN ('anel', 'pistao')) OR
  (i.code = 'PEC-004' AND t.name IN ('anel', 'pistao')) OR
  (i.code = 'PEC-005' AND t.name IN ('junta', 'cabecote')) OR
  (i.code = 'PEC-006' AND t.name IN ('valvula', 'motor')) OR
  (i.code = 'PEC-007' AND t.name IN ('valvula', 'motor')) OR
  (i.code = 'PEC-008' AND t.name IN ('bronzina', 'motor')) OR
  (i.code = 'PEC-009' AND t.name IN ('bronzina', 'motor')) OR
  (i.code = 'PEC-010' AND t.name IN ('filtro', 'motor')) OR
  
  -- Kits
  (i.code = 'KIT-001' AND t.name IN ('kit_aneis', 'anel', 'pistao')) OR
  (i.code = 'KIT-002' AND t.name IN ('kit_juntas', 'junta', 'cabecote')) OR
  (i.code = 'KIT-003' AND t.name IN ('kit_bronzinas', 'bronzina', 'motor')) OR
  (i.code = 'KIT-004' AND t.name IN ('kit_valvulas', 'valvula', 'motor')) OR
  (i.code = 'KIT-005' AND t.name IN ('reparo_basico', 'motor'));

-- Criar relacionamentos hierárquicos
INSERT INTO catalog_item_relations (parent_id, child_id, relation)
SELECT p.id, c.id, 'contains' FROM catalog_items p, catalog_items c
WHERE 
  -- Equipamentos contêm conjuntos
  (p.code = 'EQP-001' AND c.code IN ('CJT-001', 'CJT-002', 'CJT-003')) OR
  (p.code = 'EQP-002' AND c.code IN ('CJT-001', 'CJT-003', 'CJT-005')) OR
  (p.code = 'EQP-003' AND c.code IN ('CJT-001', 'CJT-002', 'CJT-003')) OR
  (p.code = 'EQP-004' AND c.code IN ('CJT-001', 'CJT-003')) OR
  
  -- Conjuntos contêm partes
  (p.code = 'CJT-001' AND c.code IN ('PRT-001', 'PRT-002', 'PRT-003')) OR
  (p.code = 'CJT-002' AND c.code = 'PRT-004') OR
  (p.code = 'CJT-003' AND c.code = 'PRT-005') OR
  
  -- Partes contêm peças
  (p.code = 'PRT-001' AND c.code IN ('PEC-005', 'PEC-006', 'PEC-007')) OR
  (p.code = 'PRT-002' AND c.code IN ('PEC-001', 'PEC-008', 'PEC-009')) OR
  (p.code = 'PRT-003' AND c.code = 'PEC-009') OR
  
  -- Kits contêm peças
  (p.code = 'KIT-001' AND c.code IN ('PEC-002', 'PEC-003', 'PEC-004')) OR
  (p.code = 'KIT-002' AND c.code = 'PEC-005') OR
  (p.code = 'KIT-003' AND c.code IN ('PEC-008', 'PEC-009')) OR
  (p.code = 'KIT-004' AND c.code IN ('PEC-006', 'PEC-007')) OR
  (p.code = 'KIT-005' AND c.code IN ('PEC-002', 'PEC-005', 'PEC-008'));

COMMIT;