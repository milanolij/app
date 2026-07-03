import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createCallOut } from '@/api/callouts';
import { ApiError } from '@/api/client';
import type { BrevetType, CallOut, CallOutReason, CreateCallOutPayload } from '@/api/types';
import { REDEN_LABELS } from '@/callouts/display';
import { addPlacedCallout } from '@/callouts/poolStorage';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';

const REDEN_OPTIONS: CallOutReason[] = ['tekort', 'ziekte', 'drukte', 'anders'];

type BrevetChoice = BrevetType | 'automatisch';

const BREVET_CHOICE_LABELS: Record<BrevetChoice, string> = {
  automatisch: 'Automatisch',
  basisredder: 'Basisredder',
  hoger_redder: 'Hoger Redder',
};

export default function OproepPlaatsenScreen() {
  const queryClient = useQueryClient();

  const [reden, setReden] = useState<CallOutReason>('tekort');
  const [aantalRedders, setAantalRedders] = useState('1');
  const [brevetChoice, setBrevetChoice] = useState<BrevetChoice>('automatisch');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [eindDate, setEindDate] = useState<Date | null>(null);
  const [vergoeding, setVergoeding] = useState('');
  const [formError, setFormError] = useState<ApiError | null>(null);

  const createMutation = useMutation<CallOut & { redders_uitgenodigd: number }, ApiError, CreateCallOutPayload>({
    mutationFn: createCallOut,
    onSuccess: async (result) => {
      await addPlacedCallout({
        id: result.id,
        reden: result.reden,
        aantal_redders_nodig: result.aantal_redders_nodig,
        vereist_brevet_type: result.vereist_brevet_type,
        start_tijd: result.start_tijd,
        eind_tijd: result.eind_tijd,
        vergoeding: result.vergoeding,
        aangemaakt_op: result.aangemaakt_op,
      });
      queryClient.invalidateQueries({ queryKey: ['placed-callouts'] });
      router.replace({ pathname: '/(pool)/oproep-status/[id]', params: { id: result.id } });
    },
  });

  function validate(): ApiError | null {
    const aantal = parseInt(aantalRedders, 10);
    if (!Number.isInteger(aantal) || aantal < 1) {
      return new ApiError(400, 'Vul een geldig aantal redders in (minimaal 1)', 'Bad Request');
    }
    const vergoedingNum = Number(vergoeding.replace(',', '.'));
    if (!Number.isFinite(vergoedingNum) || vergoedingNum < 0) {
      return new ApiError(400, 'Vul een geldige vergoeding in (0 of hoger)', 'Bad Request');
    }
    if (!startDate || !eindDate) {
      return new ApiError(400, 'Kies een startdatum/tijd en einddatum/tijd', 'Bad Request');
    }
    if (eindDate.getTime() <= startDate.getTime()) {
      return new ApiError(400, 'Eindtijd moet na de starttijd liggen', 'Bad Request');
    }
    return null;
  }

  function handleSubmit() {
    const validationError = validate();
    setFormError(validationError);
    if (validationError) {
      return;
    }
    createMutation.mutate({
      reden,
      aantal_redders_nodig: parseInt(aantalRedders, 10),
      vereist_brevet_type: brevetChoice === 'automatisch' ? undefined : brevetChoice,
      start_tijd: startDate!.toISOString(),
      eind_tijd: eindDate!.toISOString(),
      vergoeding: Number(vergoeding.replace(',', '.')),
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Link href="/(pool)/home" style={styles.backLink}>
          <Text style={styles.backLinkText}>Terug</Text>
        </Link>
        <Text style={styles.title}>Oproep plaatsen</Text>

        <ErrorBanner error={formError ?? createMutation.error} />

        <Text style={styles.label}>Reden</Text>
        <View style={styles.grid}>
          {REDEN_OPTIONS.map((option) => (
            <View key={option} style={styles.gridButton}>
              <PrimaryButton
                title={REDEN_LABELS[option]}
                variant={reden === option ? 'primary' : 'secondary'}
                onPress={() => setReden(option)}
              />
            </View>
          ))}
        </View>

        <FormField
          label="Aantal redders nodig"
          value={aantalRedders}
          onChangeText={setAantalRedders}
          keyboardType="numeric"
          placeholder="1"
        />

        <Text style={styles.label}>Vereist brevet</Text>
        <View style={styles.row}>
          {(['automatisch', 'basisredder', 'hoger_redder'] as BrevetChoice[]).map((option) => (
            <View key={option} style={styles.rowButton}>
              <PrimaryButton
                title={BREVET_CHOICE_LABELS[option]}
                variant={brevetChoice === option ? 'primary' : 'secondary'}
                onPress={() => setBrevetChoice(option)}
              />
            </View>
          ))}
        </View>
        <Text style={styles.helpText}>
          Bij &apos;Automatisch&apos; bepaalt Reddersnet het vereiste brevet op basis van de diepte en
          oppervlakte van je geregistreerde zwembad.
        </Text>

        <DateTimeField label="Starttijd" value={startDate} onChange={setStartDate} />
        <DateTimeField label="Eindtijd" value={eindDate} onChange={setEindDate} />

        <FormField
          label="Vergoeding (€)"
          value={vergoeding}
          onChangeText={setVergoeding}
          keyboardType="decimal-pad"
          placeholder="65"
        />

        <PrimaryButton title="Oproep plaatsen" onPress={handleSubmit} loading={createMutation.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

function DateTimeField(props: DateTimeFieldProps) {
  if (Platform.OS === 'web') {
    return <WebDateTimeField {...props} />;
  }
  return <NativeDateTimeField {...props} />;
}

function WebDateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [datePart, setDatePart] = useState(value ? isoDatePart(value) : '');
  const [timePart, setTimePart] = useState(value ? isoTimePart(value) : '');

  function handleDatePartChange(text: string) {
    setDatePart(text);
    const combined = parseDateAndTime(text, timePart);
    if (combined) {
      onChange(combined);
    }
  }

  function handleTimePartChange(text: string) {
    setTimePart(text);
    const combined = parseDateAndTime(datePart, text);
    if (combined) {
      onChange(combined);
    }
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.webDateRow}>
        <FormField
          label="Datum"
          style={styles.webDateInput}
          placeholder="JJJJ-MM-DD"
          value={datePart}
          onChangeText={handleDatePartChange}
        />
        <FormField
          label="Tijd"
          style={styles.webTimeInput}
          placeholder="UU:MM"
          value={timePart}
          onChangeText={handleTimePartChange}
        />
      </View>
    </View>
  );
}

function isoDatePart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isoTimePart(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseDateAndTime(datePart: string, timePart: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !/^\d{2}:\d{2}$/.test(timePart)) {
    return null;
  }
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const combined = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(combined.getTime()) ? null : combined;
}

function NativeDateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [step, setStep] = useState<'closed' | 'date' | 'time'>('closed');
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  function onDateChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') {
      setStep('closed');
    }
    if (event.type === 'dismissed' || !picked) {
      return;
    }
    setPendingDate(picked);
    setStep('time');
  }

  function onTimeChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') {
      setStep('closed');
    }
    if (event.type === 'dismissed' || !picked || !pendingDate) {
      return;
    }
    const combined = new Date(pendingDate);
    combined.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(combined);
    setStep('closed');
    setPendingDate(null);
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dateInput} onPress={() => setStep('date')}>
        <Text style={styles.dateInputText}>
          {value
            ? value.toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })
            : 'Kies datum en tijd'}
        </Text>
      </Pressable>
      {step === 'date' && (
        <DateTimePicker
          value={pendingDate ?? value ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {step === 'time' && (
        <DateTimePicker
          value={pendingDate ?? new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: '#0f766e',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridButton: {
    minWidth: '47%',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  rowButton: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  dateInputText: {
    fontSize: 15,
    color: '#0f172a',
  },
  webDateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  webDateInput: {
    flex: 2,
  },
  webTimeInput: {
    flex: 1,
  },
});
