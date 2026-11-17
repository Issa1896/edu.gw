-- =====================================================================
-- edu.gw — novo destino de comunicado: 'publico' (página pública da escola).
-- Fica numa migração própria porque um valor novo de enum só pode ser
-- usado depois de a transação que o cria terminar.
-- =====================================================================
alter type publico_comunicado add value if not exists 'publico';
