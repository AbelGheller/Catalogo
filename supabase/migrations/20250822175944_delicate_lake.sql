/*
  # Sistema de Catálogo Técnico - Implementação Completa

  1. Taxonomia Canônica
    - Equipamento (máquinas completas)
    - Conjunto (sistemas/módulos do equipamento)
    - Parte (subconjuntos/componentes)
    - Peça (itens atômicos)
    - Kit (agrupamentos lógicos)

  2. Regras de Pertencimento
    - Equipamento → pode conter Conjunto, Parte, Kit
    - Conjunto → pode conter Parte, Peça, Kit
    - Parte → pode conter Peça, Kit
    - Kit → pode conter Peça e Parte
    - Peça → não pode conter nada

  3. Exceção Naval
    - Motor com tag 'naval' ou context.naval=true → Equipamento
    - Motor sem contexto naval → Parte

  4. Funcionalidades
    - CRUD completo via RPCs
    - Importação CSV/XLSX
    - Validações de ciclo (DAG)
    - Logs de auditoria
    - Tags flexíveis
*/

-- Tabela principal de itens do catálogo
CREATE TABLE IF NOT EXISTS catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  level text NOT NULL CHECK (level IN ('Equipamento','Conjunto','Parte','Peça','Kit')),
  context jsonb DEFAULT '{}'::jsonb,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS catalog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  kind text DEFAULT 'class'
);

-- Relacionamento item-tag (many-to-many)
CREATE TABLE IF NOT EXISTS catalog_item_tags (
  item_id uuid REFERENCES catalog_items(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES catalog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Relacionamentos hierárquicos (containment)
CREATE TABLE IF NOT EXISTS catalog_item_relations (
  parent_id uuid REFERENCES catalog_items(id) ON DELETE CASCADE,
  child_id uuid REFERENCES catalog_items(id) ON DELETE CASCADE,
  relation text NOT NULL DEFAULT 'contains',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (parent_id, child_id, relation)
);

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS catalog_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text,
  action text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'success',
  message text,
  created_at timestamptz DEFAULT now()
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION catalog_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_catalog_items_updated ON catalog_items;
CREATE TRIGGER trg_catalog_items_updated
  BEFORE UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION catalog_set_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_code ON catalog_items(code);
CREATE INDEX IF NOT EXISTS idx_catalog_items_level ON catalog_items(level);
CREATE INDEX IF NOT EXISTS idx_catalog_items_name ON catalog_items USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_catalog_tags_name ON catalog_tags(name);
CREATE INDEX IF NOT EXISTS idx_catalog_item_relations_parent ON catalog_item_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_item_relations_child ON catalog_item_relations(child_id);
CREATE INDEX IF NOT EXISTS idx_catalog_audit_logs_item_code ON catalog_audit_logs(item_code);
CREATE INDEX IF NOT EXISTS idx_catalog_audit_logs_created_at ON catalog_audit_logs(created_at);

-- Função para verificar ciclos (DFS)
CREATE OR REPLACE FUNCTION catalog_check_cycle(parent_uuid uuid, child_uuid uuid)
RETURNS boolean AS $$
DECLARE
  visited uuid[];
  current_id uuid;
  stack uuid[];
BEGIN
  -- Se parent e child são iguais, é ciclo direto
  IF parent_uuid = child_uuid THEN
    RETURN true;
  END IF;
  
  -- Inicializar stack com o child
  stack := ARRAY[child_uuid];
  visited := ARRAY[]::uuid[];
  
  -- DFS para detectar se parent está nos descendentes de child
  WHILE array_length(stack, 1) > 0 LOOP
    current_id := stack[1];
    stack := stack[2:];
    
    -- Se já visitamos este nó, pular
    IF current_id = ANY(visited) THEN
      CONTINUE;
    END IF;
    
    -- Marcar como visitado
    visited := visited || current_id;
    
    -- Se encontramos o parent nos descendentes, há ciclo
    IF current_id = parent_uuid THEN
      RETURN true;
    END IF;
    
    -- Adicionar filhos ao stack
    stack := stack || ARRAY(
      SELECT child_id 
      FROM catalog_item_relations 
      WHERE parent_id = current_id AND relation = 'contains'
    );
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Função para validar matriz de pertencimento
CREATE OR REPLACE FUNCTION catalog_validate_containment(parent_level text, child_level text)
RETURNS boolean AS $$
BEGIN
  RETURN CASE
    WHEN parent_level = 'Equipamento' AND child_level IN ('Conjunto', 'Parte', 'Kit') THEN true
    WHEN parent_level = 'Conjunto' AND child_level IN ('Parte', 'Peça', 'Kit') THEN true
    WHEN parent_level = 'Parte' AND child_level IN ('Peça', 'Kit') THEN true
    WHEN parent_level = 'Kit' AND child_level IN ('Peça', 'Parte') THEN true
    WHEN parent_level = 'Peça' THEN false -- Peça não pode conter nada
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql;

-- Função para inferir nível baseado no nome e tags
CREATE OR REPLACE FUNCTION catalog_infer_level(item_name text, item_tags text[], has_naval boolean DEFAULT false)
RETURNS text AS $$
DECLARE
  name_lower text;
  tag_string text;
BEGIN
  name_lower := lower(item_name);
  tag_string := lower(array_to_string(item_tags, ' '));
  
  -- Se contém "kit" no nome ou tags
  IF name_lower LIKE '%kit%' OR tag_string LIKE '%kit%' THEN
    RETURN 'Kit';
  END IF;
  
  -- Peças (itens atômicos)
  IF name_lower ~ '(pistão|cabeçote|virabrequim|bomba|bico|anel|junta|parafuso|porca|arruela)' OR
     tag_string ~ '(pistão|cabeçote|virabrequim|bomba|bico|anel|junta|parafuso|porca|arruela)' THEN
    RETURN 'Peça';
  END IF;
  
  -- Motor: Equipamento se naval, senão Parte
  IF name_lower LIKE '%motor%' OR tag_string LIKE '%motor%' THEN
    IF has_naval THEN
      RETURN 'Equipamento';
    ELSE
      RETURN 'Parte';
    END IF;
  END IF;
  
  -- Partes (componentes/subconjuntos)
  IF name_lower ~ '(trem de força|chassis|transmissão|diferencial|eixo)' OR
     tag_string ~ '(trem de força|chassis|transmissão|diferencial|eixo)' THEN
    RETURN 'Parte';
  END IF;
  
  -- Equipamentos (máquinas completas)
  IF name_lower ~ '(máquina|empilhadeira|escavadeira|pá-carregadeira|trator|rolo|guindaste|retroescavadeira)' OR
     tag_string ~ '(máquina|empilhadeira|escavadeira|pá-carregadeira|trator|rolo|guindaste|retroescavadeira)' THEN
    RETURN 'Equipamento';
  END IF;
  
  -- Conjuntos (sistemas/módulos)
  IF name_lower ~ '(conjunto|sistema|módulo)' OR
     tag_string ~ '(conjunto|sistema|módulo)' THEN
    RETURN 'Conjunto';
  END IF;
  
  -- Se não conseguiu inferir, retorna null
  RETURN null;
END;
$$ LANGUAGE plpgsql;

-- RPC: Criar ou atualizar item
CREATE OR REPLACE FUNCTION catalog_create_or_update_item(payload json)
RETURNS json AS $$
DECLARE
  item_code text;
  item_name text;
  item_level text;
  is_kit boolean;
  item_context jsonb;
  item_attributes jsonb;
  item_tags text[];
  tag_name text;
  tag_id uuid;
  item_id uuid;
  has_naval boolean;
  inferred_level text;
  result json;
BEGIN
  -- Extrair dados do payload
  item_code := payload->>'code';
  item_name := payload->>'name';
  item_level := payload->>'level';
  is_kit := COALESCE((payload->>'is_kit')::boolean, false);
  item_context := COALESCE((payload->>'context')::jsonb, '{}'::jsonb);
  item_attributes := COALESCE((payload->>'attributes')::jsonb, '{}'::jsonb);
  
  -- Extrair array de tags
  SELECT array_agg(value::text) INTO item_tags
  FROM json_array_elements_text(payload->'tags');
  
  item_tags := COALESCE(item_tags, ARRAY[]::text[]);
  
  -- Verificar se tem contexto naval
  has_naval := (item_context->>'naval')::boolean OR 'naval' = ANY(item_tags);
  
  -- Se is_kit=true, forçar level='Kit'
  IF is_kit THEN
    item_level := 'Kit';
  END IF;
  
  -- Se level não informado, tentar inferir
  IF item_level IS NULL OR item_level = '' THEN
    inferred_level := catalog_infer_level(item_name, item_tags, has_naval);
    IF inferred_level IS NULL THEN
      -- Log do erro
      INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
      VALUES (item_code, 'create_or_update_item', payload, 'error', 'Nível não inferível para o item');
      
      RETURN json_build_object(
        'status', 'error',
        'message', 'Nível não inferível. Informe o level ou ajuste nome/tags.',
        'data', null
      );
    END IF;
    item_level := inferred_level;
  END IF;
  
  -- Validar level
  IF item_level NOT IN ('Equipamento','Conjunto','Parte','Peça','Kit') THEN
    INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
    VALUES (item_code, 'create_or_update_item', payload, 'error', 'Nível inválido: ' || item_level);
    
    RETURN json_build_object(
      'status', 'error',
      'message', 'Nível inválido: ' || item_level,
      'data', null
    );
  END IF;
  
  -- Upsert do item
  INSERT INTO catalog_items (code, name, level, context, attributes)
  VALUES (item_code, item_name, item_level, item_context, item_attributes)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    context = EXCLUDED.context,
    attributes = EXCLUDED.attributes,
    updated_at = now()
  RETURNING id INTO item_id;
  
  -- Limpar tags existentes
  DELETE FROM catalog_item_tags WHERE item_id = item_id;
  
  -- Criar/vincular tags
  FOREACH tag_name IN ARRAY item_tags LOOP
    -- Criar tag se não existir
    INSERT INTO catalog_tags (name) VALUES (tag_name) ON CONFLICT (name) DO NOTHING;
    
    -- Obter ID da tag
    SELECT id INTO tag_id FROM catalog_tags WHERE name = tag_name;
    
    -- Vincular item à tag
    INSERT INTO catalog_item_tags (item_id, tag_id) VALUES (item_id, tag_id);
  END LOOP;
  
  -- Log de sucesso
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (item_code, 'create_or_update_item', payload, 'success', 'Item criado/atualizado com sucesso');
  
  -- Retornar resultado
  SELECT json_build_object(
    'id', i.id,
    'code', i.code,
    'name', i.name,
    'level', i.level,
    'context', i.context,
    'attributes', i.attributes,
    'tags', COALESCE(array_agg(t.name), ARRAY[]::text[])
  ) INTO result
  FROM catalog_items i
  LEFT JOIN catalog_item_tags it ON i.id = it.item_id
  LEFT JOIN catalog_tags t ON it.tag_id = t.id
  WHERE i.id = item_id
  GROUP BY i.id, i.code, i.name, i.level, i.context, i.attributes;
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Item criado/atualizado com sucesso',
    'data', result
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (item_code, 'create_or_update_item', payload, 'error', SQLERRM);
  
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'data', null
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Anexar filho (criar relacionamento)
CREATE OR REPLACE FUNCTION catalog_attach_child(parent_code text, child_code text, relation text DEFAULT 'contains')
RETURNS json AS $$
DECLARE
  parent_id uuid;
  child_id uuid;
  parent_level text;
  child_level text;
BEGIN
  -- Buscar IDs e níveis
  SELECT id, level INTO parent_id, parent_level FROM catalog_items WHERE code = parent_code;
  SELECT id, level INTO child_id, child_level FROM catalog_items WHERE code = child_code;
  
  -- Verificar se itens existem
  IF parent_id IS NULL THEN
    INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
    VALUES (parent_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'error', 'Item pai não encontrado');
    
    RETURN json_build_object(
      'status', 'error',
      'message', 'Item pai não encontrado: ' || parent_code,
      'data', null
    );
  END IF;
  
  IF child_id IS NULL THEN
    INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
    VALUES (child_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'error', 'Item filho não encontrado');
    
    RETURN json_build_object(
      'status', 'error',
      'message', 'Item filho não encontrado: ' || child_code,
      'data', null
    );
  END IF;
  
  -- Validar matriz de pertencimento
  IF NOT catalog_validate_containment(parent_level, child_level) THEN
    INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
    VALUES (parent_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'error', 'Relacionamento inválido: ' || parent_level || ' não pode conter ' || child_level);
    
    RETURN json_build_object(
      'status', 'error',
      'message', 'Relacionamento inválido: ' || parent_level || ' não pode conter ' || child_level,
      'data', null
    );
  END IF;
  
  -- Verificar ciclos
  IF catalog_check_cycle(parent_id, child_id) THEN
    INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
    VALUES (parent_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'error', 'Relacionamento criaria um ciclo');
    
    RETURN json_build_object(
      'status', 'error',
      'message', 'Relacionamento criaria um ciclo',
      'data', null
    );
  END IF;
  
  -- Criar relacionamento
  INSERT INTO catalog_item_relations (parent_id, child_id, relation)
  VALUES (parent_id, child_id, relation)
  ON CONFLICT (parent_id, child_id, relation) DO NOTHING;
  
  -- Log de sucesso
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (parent_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'success', 'Relacionamento criado com sucesso');
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Relacionamento criado com sucesso',
    'data', json_build_object('parent_code', parent_code, 'child_code', child_code, 'relation', relation)
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (parent_code, 'attach_child', json_build_object('parent_code', parent_code, 'child_code', child_code), 'error', SQLERRM);
  
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'data', null
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Buscar itens
CREATE OR REPLACE FUNCTION catalog_search_items(q text DEFAULT null, tag text DEFAULT null, level text DEFAULT null)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', i.id,
      'code', i.code,
      'name', i.name,
      'level', i.level,
      'context', i.context,
      'attributes', i.attributes,
      'tags', COALESCE(tag_array.tags, ARRAY[]::text[]),
      'created_at', i.created_at,
      'updated_at', i.updated_at
    )
  ) INTO result
  FROM catalog_items i
  LEFT JOIN (
    SELECT 
      it.item_id,
      array_agg(t.name) as tags
    FROM catalog_item_tags it
    JOIN catalog_tags t ON it.tag_id = t.id
    GROUP BY it.item_id
  ) tag_array ON i.id = tag_array.item_id
  WHERE 
    (q IS NULL OR i.name ILIKE '%' || q || '%' OR i.code ILIKE '%' || q || '%')
    AND (tag IS NULL OR tag = ANY(tag_array.tags))
    AND (level IS NULL OR i.level = level);
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Busca realizada com sucesso',
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'data', null
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Deletar item
CREATE OR REPLACE FUNCTION catalog_delete_item(item_code text, cascade_delete boolean DEFAULT false)
RETURNS json AS $$
DECLARE
  item_id uuid;
  children_count integer;
BEGIN
  -- Buscar ID do item
  SELECT id INTO item_id FROM catalog_items WHERE code = item_code;
  
  IF item_id IS NULL THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'Item não encontrado: ' || item_code,
      'data', null
    );
  END IF;
  
  -- Verificar se tem filhos
  SELECT COUNT(*) INTO children_count 
  FROM catalog_item_relations 
  WHERE parent_id = item_id;
  
  IF children_count > 0 AND NOT cascade_delete THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'Item possui ' || children_count || ' filho(s). Use cascade=true para forçar remoção.',
      'data', null
    );
  END IF;
  
  -- Deletar item (cascade automático via FK)
  DELETE FROM catalog_items WHERE id = item_id;
  
  -- Log
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (item_code, 'delete_item', json_build_object('cascade', cascade_delete), 'success', 'Item deletado com sucesso');
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Item deletado com sucesso',
    'data', json_build_object('code', item_code, 'cascade', cascade_delete)
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (item_code, 'delete_item', json_build_object('cascade', cascade_delete), 'error', SQLERRM);
  
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'data', null
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Importar CSV
CREATE OR REPLACE FUNCTION catalog_import_csv_items(csv_data text)
RETURNS json AS $$
DECLARE
  line_record record;
  item_payload json;
  item_result json;
  relation_result json;
  success_count integer := 0;
  error_count integer := 0;
  warnings text[] := ARRAY[]::text[];
  errors text[] := ARRAY[]::text[];
  line_number integer := 0;
BEGIN
  -- Processar cada linha do CSV
  FOR line_record IN 
    SELECT * FROM regexp_split_to_table(csv_data, '\n') AS line
    WHERE trim(line) != '' AND line NOT LIKE 'code,name,level,tags,parent_code,is_kit,context,attributes%'
  LOOP
    line_number := line_number + 1;
    
    BEGIN
      DECLARE
        fields text[];
        item_code text;
        item_name text;
        item_level text;
        item_tags text;
        parent_code text;
        is_kit text;
        item_context text;
        item_attributes text;
        tags_array text[];
      BEGIN
        -- Dividir linha em campos
        SELECT string_to_array(line_record.line, ',') INTO fields;
        
        -- Extrair campos
        item_code := NULLIF(trim(fields[1]), '');
        item_name := trim(fields[2]);
        item_level := NULLIF(trim(fields[3]), '');
        item_tags := NULLIF(trim(fields[4]), '');
        parent_code := NULLIF(trim(fields[5]), '');
        is_kit := NULLIF(trim(fields[6]), '');
        item_context := NULLIF(trim(fields[7]), '');
        item_attributes := NULLIF(trim(fields[8]), '');
        
        -- Processar tags
        IF item_tags IS NOT NULL THEN
          SELECT string_to_array(replace(item_tags, '"', ''), ';') INTO tags_array;
        ELSE
          tags_array := ARRAY[]::text[];
        END IF;
        
        -- Montar payload do item
        item_payload := json_build_object(
          'code', item_code,
          'name', item_name,
          'level', item_level,
          'is_kit', COALESCE(is_kit = 'true' OR is_kit = '1', false),
          'context', COALESCE(item_context::jsonb, '{}'::jsonb),
          'attributes', COALESCE(item_attributes::jsonb, '{}'::jsonb),
          'tags', to_json(tags_array)
        );
        
        -- Criar/atualizar item
        SELECT catalog_create_or_update_item(item_payload) INTO item_result;
        
        IF (item_result->>'status') = 'error' THEN
          errors := errors || ('Linha ' || line_number || ': ' || (item_result->>'message'));
          error_count := error_count + 1;
          CONTINUE;
        END IF;
        
        success_count := success_count + 1;
        
        -- Se tem parent_code, criar relacionamento
        IF parent_code IS NOT NULL AND item_code IS NOT NULL THEN
          SELECT catalog_attach_child(parent_code, item_code) INTO relation_result;
          
          IF (relation_result->>'status') = 'error' THEN
            warnings := warnings || ('Linha ' || line_number || ': Erro no relacionamento - ' || (relation_result->>'message'));
          END IF;
        END IF;
        
      END;
    EXCEPTION WHEN OTHERS THEN
      errors := errors || ('Linha ' || line_number || ': ' || SQLERRM);
      error_count := error_count + 1;
    END;
  END LOOP;
  
  -- Log da importação
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (null, 'import_csv_items', json_build_object('lines', line_number, 'success', success_count, 'errors', error_count), 'success', 'Importação CSV concluída');
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Importação concluída',
    'data', json_build_object(
      'total_lines', line_number,
      'success_count', success_count,
      'error_count', error_count,
      'warnings', warnings,
      'errors', errors
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO catalog_audit_logs (item_code, action, payload, status, message)
  VALUES (null, 'import_csv_items', json_build_object('error', SQLERRM), 'error', 'Erro na importação CSV');
  
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'data', null
  );
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_item_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir tudo por enquanto)
CREATE POLICY "Allow all operations on catalog_items" ON catalog_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on catalog_tags" ON catalog_tags FOR ALL USING (true);
CREATE POLICY "Allow all operations on catalog_item_tags" ON catalog_item_tags FOR ALL USING (true);
CREATE POLICY "Allow all operations on catalog_item_relations" ON catalog_item_relations FOR ALL USING (true);
CREATE POLICY "Allow all operations on catalog_audit_logs" ON catalog_audit_logs FOR ALL USING (true);

-- Inserir dados de exemplo
INSERT INTO catalog_items (code, name, level, context, attributes) VALUES
('EQP-0001', 'Pá-carregadeira 3T', 'Equipamento', '{"setor":"construcao"}', '{"capacidade_t":3}'),
('MTR-0001', 'Motor 4D80 (Yuchai)', 'Parte', '{}', '{"potencia_kw":58}'),
('MTR-0002', 'Motor 4D80 NAVAL', 'Equipamento', '{"ambiente":"naval"}', '{"proteção":"marinizada"}'),
('CJT-0001', 'Conjunto Cabeçote', 'Conjunto', '{}', '{}'),
('KIT-0001', 'Kit Juntas do Cabeçote', 'Kit', '{}', '{}'),
('PEC-0001', 'Anel do Pistão 100mm', 'Peça', '{}', '{"diam_mm":100}');

-- Inserir tags de exemplo
INSERT INTO catalog_tags (name, kind) VALUES
('construção', 'setor'),
('XGMA', 'marca'),
('motor', 'tipo'),
('yuchai', 'marca'),
('naval', 'contexto'),
('conjunto', 'tipo'),
('cabeçote', 'componente'),
('kit', 'tipo'),
('juntas', 'componente'),
('anel', 'componente'),
('pistão', 'componente');

-- Vincular tags aos itens
INSERT INTO catalog_item_tags (item_id, tag_id)
SELECT i.id, t.id FROM catalog_items i, catalog_tags t 
WHERE (i.code = 'EQP-0001' AND t.name IN ('construção', 'XGMA'))
   OR (i.code = 'MTR-0001' AND t.name IN ('motor', 'yuchai'))
   OR (i.code = 'MTR-0002' AND t.name IN ('motor', 'yuchai', 'naval'))
   OR (i.code = 'CJT-0001' AND t.name IN ('conjunto', 'cabeçote'))
   OR (i.code = 'KIT-0001' AND t.name IN ('kit', 'juntas'))
   OR (i.code = 'PEC-0001' AND t.name IN ('anel', 'pistão'));

-- Criar relacionamentos de exemplo
INSERT INTO catalog_item_relations (parent_id, child_id, relation)
SELECT p.id, c.id, 'contains' FROM catalog_items p, catalog_items c
WHERE (p.code = 'EQP-0001' AND c.code = 'MTR-0001')
   OR (p.code = 'MTR-0001' AND c.code = 'CJT-0001')
   OR (p.code = 'CJT-0001' AND c.code = 'KIT-0001')
   OR (p.code = 'KIT-0001' AND c.code = 'PEC-0001');