import { describe, expect, it, vi } from 'vitest';

vi.mock('@/database/db', () => ({
  withDatabase: vi.fn(),
}));

import { mapIntervalTemplateRow } from '../../../src/features/interval-training/interval-template.repository';

describe('interval template repository mappers', () => {
  it('maps interval template rows to domain objects', () => {
    expect(
      mapIntervalTemplateRow({
        cooldown_duration: 300,
        created_at: '2026-07-02T12:00:00.000Z',
        id: 'template_1',
        name: 'Tiros curtos',
        rest_target_type: 'TIME',
        rest_target_value: 60,
        shot_target_type: 'DISTANCE',
        shot_target_value: 400,
        shots_count: 8,
        updated_at: '2026-07-02T12:00:00.000Z',
        warmup_duration: 600,
      }),
    ).toEqual({
      cooldownDuration: 300,
      createdAt: '2026-07-02T12:00:00.000Z',
      id: 'template_1',
      name: 'Tiros curtos',
      restTargetType: 'TIME',
      restTargetValue: 60,
      shotTargetType: 'DISTANCE',
      shotTargetValue: 400,
      shotsCount: 8,
      updatedAt: '2026-07-02T12:00:00.000Z',
      warmupDuration: 600,
    });
  });
});
