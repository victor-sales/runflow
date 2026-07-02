import { withDatabase } from '@/database/db';
import { TABLES } from '@/database/schema';
import type { IntervalTemplate } from '@/features/interval-training/interval.types';
import type { TargetType } from '@/features/workout/workout.types';
import { createId } from '@/utils/id';

type IntervalTemplateRow = {
  id: string;
  name: string;
  warmup_duration: number;
  shot_target_type: TargetType;
  shot_target_value: number;
  shots_count: number;
  rest_target_type: TargetType;
  rest_target_value: number;
  cooldown_duration: number;
  created_at: string;
  updated_at: string;
};

export type CreateIntervalTemplateInput = {
  id?: string;
  name: string;
  warmupDuration?: number;
  shotTargetType: TargetType;
  shotTargetValue: number;
  shotsCount: number;
  restTargetType: TargetType;
  restTargetValue: number;
  cooldownDuration?: number;
};

export type UpdateIntervalTemplateInput = Partial<
  Omit<IntervalTemplate, 'id' | 'createdAt' | 'updatedAt'>
>;

export function mapIntervalTemplateRow(
  row: IntervalTemplateRow,
): IntervalTemplate {
  return {
    id: row.id,
    name: row.name,
    warmupDuration: row.warmup_duration,
    shotTargetType: row.shot_target_type,
    shotTargetValue: row.shot_target_value,
    shotsCount: row.shots_count,
    restTargetType: row.rest_target_type,
    restTargetValue: row.rest_target_value,
    cooldownDuration: row.cooldown_duration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getIntervalTemplateById(
  id: string,
): Promise<IntervalTemplate | null> {
  return withDatabase(async (database) => {
    const row = await database.getFirstAsync<IntervalTemplateRow>(
      `SELECT * FROM ${TABLES.intervalTemplates} WHERE id = ?;`,
      id,
    );

    return row ? mapIntervalTemplateRow(row) : null;
  });
}

async function createIntervalTemplate(
  input: CreateIntervalTemplateInput,
): Promise<IntervalTemplate> {
  const now = new Date().toISOString();
  const template: IntervalTemplate = {
    id: input.id ?? createId('template'),
    name: input.name,
    warmupDuration: input.warmupDuration ?? 0,
    shotTargetType: input.shotTargetType,
    shotTargetValue: input.shotTargetValue,
    shotsCount: input.shotsCount,
    restTargetType: input.restTargetType,
    restTargetValue: input.restTargetValue,
    cooldownDuration: input.cooldownDuration ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await withDatabase((database) =>
    database.runAsync(
      `INSERT INTO ${TABLES.intervalTemplates}
        (id, name, warmup_duration, shot_target_type, shot_target_value, shots_count, rest_target_type, rest_target_value, cooldown_duration, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      template.id,
      template.name,
      template.warmupDuration,
      template.shotTargetType,
      template.shotTargetValue,
      template.shotsCount,
      template.restTargetType,
      template.restTargetValue,
      template.cooldownDuration,
      template.createdAt,
      template.updatedAt,
    ),
  );

  return template;
}

async function updateIntervalTemplate(
  id: string,
  input: UpdateIntervalTemplateInput,
): Promise<IntervalTemplate | null> {
  const current = await getIntervalTemplateById(id);

  if (!current) {
    return null;
  }

  const updated: IntervalTemplate = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await withDatabase((database) =>
    database.runAsync(
      `UPDATE ${TABLES.intervalTemplates}
       SET name = ?, warmup_duration = ?, shot_target_type = ?, shot_target_value = ?, shots_count = ?, rest_target_type = ?, rest_target_value = ?, cooldown_duration = ?, updated_at = ?
       WHERE id = ?;`,
      updated.name,
      updated.warmupDuration,
      updated.shotTargetType,
      updated.shotTargetValue,
      updated.shotsCount,
      updated.restTargetType,
      updated.restTargetValue,
      updated.cooldownDuration,
      updated.updatedAt,
      id,
    ),
  );

  return updated;
}

async function listIntervalTemplates(): Promise<IntervalTemplate[]> {
  return withDatabase(async (database) => {
    const rows = await database.getAllAsync<IntervalTemplateRow>(
      `SELECT * FROM ${TABLES.intervalTemplates} ORDER BY created_at DESC;`,
    );

    return rows.map(mapIntervalTemplateRow);
  });
}

async function deleteIntervalTemplate(id: string): Promise<void> {
  await withDatabase((database) =>
    database.runAsync(
      `DELETE FROM ${TABLES.intervalTemplates} WHERE id = ?;`,
      id,
    ),
  );
}

export const IntervalTemplateRepository = {
  createIntervalTemplate,
  deleteIntervalTemplate,
  getIntervalTemplateById,
  listIntervalTemplates,
  updateIntervalTemplate,
};
