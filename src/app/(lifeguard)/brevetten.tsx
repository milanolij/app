import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listMyBrevetten, PickedFile, uploadBrevet, UploadBrevetPayload } from '@/api/brevetten';
import { ApiError } from '@/api/client';
import type { Brevet, BrevetType } from '@/api/types';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBadge } from '@/components/StatusBadge';

const TYPE_LABELS: Record<BrevetType, string> = {
  hoger_redder: 'Hoger Redder',
  basisredder: 'Basisredder',
};

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function BrevettenScreen() {
  const queryClient = useQueryClient();
  const {
    data: brevetten,
    isLoading,
    error: listError,
  } = useQuery<Brevet[], ApiError>({
    queryKey: ['brevetten'],
    queryFn: listMyBrevetten,
  });

  const [type, setType] = useState<BrevetType>('basisredder');
  const [vervaldatum, setVervaldatum] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const uploadMutation = useMutation<Brevet, ApiError, UploadBrevetPayload>({
    mutationFn: uploadBrevet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brevetten'] });
      setVervaldatum('');
      setFile(null);
    },
  });

  const pickFile = async () => {
    setFormError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MIME_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      webFile: asset.file,
    });
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!file) {
      setFormError(new ApiError(400, 'Kies eerst een bestand (foto of PDF)', 'Bad Request'));
      return;
    }
    if (!vervaldatum) {
      setFormError(new ApiError(400, 'Vul een vervaldatum in', 'Bad Request'));
      return;
    }
    try {
      await uploadMutation.mutateAsync({ type, vervaldatum, file });
    } catch {
      // uploadMutation.error already reflects the failure and is rendered below.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={brevetten ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BrevetRow brevet={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Link href="/(lifeguard)/home" style={styles.backLink}>
              <Text style={styles.backLinkText}>Terug</Text>
            </Link>
            <Text style={styles.title}>Mijn brevetten</Text>

            <View style={styles.uploadCard}>
              <Text style={styles.sectionTitle}>Nieuw brevet uploaden</Text>
              <ErrorBanner error={formError ?? uploadMutation.error} />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <View style={styles.typeButton}>
                  <PrimaryButton
                    title="Basisredder"
                    variant={type === 'basisredder' ? 'primary' : 'secondary'}
                    onPress={() => setType('basisredder')}
                  />
                </View>
                <View style={styles.typeButton}>
                  <PrimaryButton
                    title="Hoger Redder"
                    variant={type === 'hoger_redder' ? 'primary' : 'secondary'}
                    onPress={() => setType('hoger_redder')}
                  />
                </View>
              </View>

              <FormField
                label="Vervaldatum (JJJJ-MM-DD)"
                value={vervaldatum}
                onChangeText={setVervaldatum}
                placeholder="2027-01-01"
              />

              <PrimaryButton
                title={file ? `Bestand: ${file.name}` : 'Kies bestand (foto/PDF)'}
                onPress={pickFile}
                variant="secondary"
              />

              <PrimaryButton
                title="Uploaden"
                onPress={handleSubmit}
                loading={uploadMutation.isPending}
              />
            </View>

            {listError && <ErrorBanner error={listError} />}
            {isLoading && <Text style={styles.loadingText}>Brevetten laden...</Text>}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? <Text style={styles.emptyText}>Nog geen brevetten geüpload.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

function BrevetRow({ brevet }: { brevet: Brevet }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{TYPE_LABELS[brevet.type]}</Text>
        <Text style={styles.rowSubtitle}>Vervalt op {brevet.vervaldatum.slice(0, 10)}</Text>
      </View>
      <StatusBadge status={brevet.weergave_status} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 8,
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
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  typeButton: {
    flex: 1,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
});
