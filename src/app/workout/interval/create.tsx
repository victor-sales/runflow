import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { z } from 'zod';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { IntervalTemplateRepository } from '@/features/interval-training/interval-template.repository';
import type { TargetType } from '@/features/workout/workout.types';

const targetTypeSchema = z.enum(['DISTANCE', 'TIME']);

const nonNegativeNumberText = z
  .string()
  .trim()
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: 'Informe um valor valido.',
  });

const positiveNumberText = z
  .string()
  .trim()
  .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: 'Informe um valor maior que zero.',
  });

const positiveIntegerText = positiveNumberText.refine(
  (value) => Number.isInteger(Number(value)),
  {
    message: 'Informe um numero inteiro.',
  },
);

const intervalTemplateFormSchema = z.object({
  cooldownMinutes: nonNegativeNumberText,
  name: z.string().trim().min(1, 'Informe o nome do treino.'),
  restTargetType: targetTypeSchema,
  restTargetValue: positiveNumberText,
  shotTargetType: targetTypeSchema,
  shotTargetValue: positiveNumberText,
  shotsCount: positiveIntegerText,
  warmupMinutes: nonNegativeNumberText,
});

type IntervalTemplateFormValues = z.infer<typeof intervalTemplateFormSchema>;

const defaultValues: IntervalTemplateFormValues = {
  cooldownMinutes: '5',
  name: '',
  restTargetType: 'TIME',
  restTargetValue: '2',
  shotTargetType: 'TIME',
  shotTargetValue: '1',
  shotsCount: '6',
  warmupMinutes: '10',
};

export default function CreateIntervalWorkoutScreen() {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
    watch,
  } = useForm<IntervalTemplateFormValues>({
    defaultValues,
    resolver: zodResolver(intervalTemplateFormSchema),
  });

  const shotTargetType = watch('shotTargetType');
  const restTargetType = watch('restTargetType');

  const onSubmit = async (values: IntervalTemplateFormValues) => {
    await IntervalTemplateRepository.createIntervalTemplate({
      cooldownDuration: minutesToSeconds(values.cooldownMinutes),
      name: values.name.trim(),
      restTargetType: values.restTargetType,
      restTargetValue: targetValueToStorage(
        values.restTargetType,
        values.restTargetValue,
      ),
      shotTargetType: values.shotTargetType,
      shotTargetValue: targetValueToStorage(
        values.shotTargetType,
        values.shotTargetValue,
      ),
      shotsCount: Number(values.shotsCount),
      warmupDuration: minutesToSeconds(values.warmupMinutes),
    });

    router.replace('/workout/interval');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Criar treino</AppText>
        <AppText color="secondary">
          Configure um modelo para usar na execucao guiada.
        </AppText>
      </View>

      <Card>
        <FormInput
          control={control}
          error={errors.name?.message}
          label="Nome"
          name="name"
          placeholder="Ex: 6x400m"
        />

        <FormInput
          control={control}
          error={errors.warmupMinutes?.message}
          keyboardType="numeric"
          label="Aquecimento em minutos"
          name="warmupMinutes"
        />

        <TargetTypeSelect
          label="Tipo do tiro"
          value={shotTargetType}
          onChange={(value) =>
            setValue('shotTargetType', value, { shouldValidate: true })
          }
        />

        <FormInput
          control={control}
          error={errors.shotTargetValue?.message}
          keyboardType="numeric"
          label={getTargetValueLabel(shotTargetType)}
          name="shotTargetValue"
        />

        <FormInput
          control={control}
          error={errors.shotsCount?.message}
          keyboardType="numeric"
          label="Quantidade de tiros"
          name="shotsCount"
        />

        <TargetTypeSelect
          label="Tipo do intervalo"
          value={restTargetType}
          onChange={(value) =>
            setValue('restTargetType', value, { shouldValidate: true })
          }
        />

        <FormInput
          control={control}
          error={errors.restTargetValue?.message}
          keyboardType="numeric"
          label={getTargetValueLabel(restTargetType)}
          name="restTargetValue"
        />

        <FormInput
          control={control}
          error={errors.cooldownMinutes?.message}
          keyboardType="numeric"
          label="Desaquecimento em minutos"
          name="cooldownMinutes"
        />

        <Button
          disabled={isSubmitting}
          fullWidth
          label={isSubmitting ? 'Salvando...' : 'Salvar treino'}
          onPress={handleSubmit(onSubmit)}
        />
      </Card>
    </Screen>
  );
}

type FormInputName = keyof IntervalTemplateFormValues;

type FormInputProps = TextInputProps & {
  control: ReturnType<typeof useForm<IntervalTemplateFormValues>>['control'];
  error?: string;
  label: string;
  name: FormInputName;
};

function FormInput({ control, error, label, name, ...props }: FormInputProps) {
  return (
    <View style={styles.field}>
      <AppText color="secondary" variant="caption">
        {label}
      </AppText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            className="min-h-[48px] rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900"
            onBlur={onBlur}
            onChangeText={onChange}
            value={String(value)}
            {...props}
          />
        )}
      />
      {error ? (
        <AppText style={styles.error} variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function TargetTypeSelect({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: TargetType) => void;
  value: TargetType;
}) {
  return (
    <View style={styles.field}>
      <AppText color="secondary" variant="caption">
        {label}
      </AppText>
      <View style={styles.segmentedControl}>
        {targetTypes.map((targetType) => (
          <Pressable
            accessibilityRole="button"
            key={targetType}
            onPress={() => onChange(targetType)}
            style={[
              styles.segmentedOption,
              value === targetType ? styles.segmentedOptionActive : null,
            ]}
          >
            <AppText
              color={value === targetType ? 'inverse' : 'primary'}
              variant="caption"
            >
              {targetType === 'TIME' ? 'Tempo' : 'Distancia'}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const targetTypes: TargetType[] = ['TIME', 'DISTANCE'];

function getTargetValueLabel(type: TargetType): string {
  return type === 'TIME' ? 'Valor em minutos' : 'Valor em metros';
}

function minutesToSeconds(minutes: string): number {
  return Math.round(Number(minutes) * 60);
}

function targetValueToStorage(type: TargetType, value: string): number {
  const numericValue = Number(value);

  return type === 'TIME' ? minutesToSeconds(value) : Math.round(numericValue);
}

const styles = StyleSheet.create({
  error: {
    color: '#DC2626',
  },
  field: {
    gap: 6,
  },
  header: {
    gap: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedOption: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentedOptionActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
});
