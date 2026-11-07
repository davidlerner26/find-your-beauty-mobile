import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './text';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';
import { t } from '../i18n';
import { Review } from '../models/professional';
import { completedBookingId, listReviews, removeReview, saveReview } from '../services/reviews';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { formatRelative } from '../utils/format-date';
import { log } from '../utils/log';
import { Button } from './button';

const STARS = [1, 2, 3, 4, 5];

function Stars({ value, onChange }: { value: number; onChange?: (stars: number) => void }) {
  return (
    <View style={styles.stars}>
      {STARS.map((star) => {
        const icon = (
          <MaterialIcons
            name="star"
            size={onChange ? 32 : 18}
            color={star <= value ? fixed.accent : fixed.border}
          />
        );
        return onChange ? (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={
              star === 1 ? t('1 estrela') : t('{{count}} estrelas', { count: star })
            }
            accessibilityState={{ selected: star <= value }}
            onPress={() => onChange(star)}
            hitSlop={4}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

// The reviews of a professional. A client with a completed booking can write, edit or delete their own.
export function ReviewsSection({ professionalId }: { professionalId: string }) {
  const auth = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  // The booking that lets this client review (null: none completed yet)
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  const uid = auth.user?.uid;
  const isClient = auth.role === 'client';
  const mine = reviews.find((review) => review.id === uid);

  const load = useCallback(async () => {
    try {
      const list = await listReviews(professionalId);
      setReviews(list);
      const own = list.find((review) => review.id === uid);
      setStars(own?.stars ?? 0);
      setText(own?.text ?? '');
      setBookingId(uid && isClient ? await completedBookingId(uid, professionalId) : null);
    } catch (error) {
      log.error('Failed to load reviews', error);
    }
  }, [professionalId, uid, isClient]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const send = async () => {
    if (!auth.user || !bookingId || !stars) {
      setMessage(t('Escolha de 1 a 5 estrelas.'));
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await saveReview(auth.user, professionalId, bookingId, stars, text);
      setReviews(await listReviews(professionalId));
      setEditing(false);
      setMessage(t('Avaliação enviada. Obrigado!'));
      toast.show(t('Avaliação enviada'));
    } catch (error) {
      log.error('Failed to save review', error);
      setMessage(t('Não foi possível enviar a avaliação. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert(t('Excluir a sua avaliação?'), undefined, [
      { text: t('Cancelar'), style: 'cancel' },
      {
        text: t('Excluir'),
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          try {
            await removeReview(uid, professionalId);
            setReviews(await listReviews(professionalId));
            setStars(0);
            setText('');
            setEditing(false);
            setMessage('');
            toast.show(t('Avaliação excluída'));
          } catch (error) {
            log.error('Failed to delete review', error);
            setMessage(t('Não foi possível excluir a avaliação. Tente novamente.'));
          }
        },
      },
    ]);

  const showForm = isClient && !!bookingId && (!mine || editing);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        {t('Avaliações')}
      </Text>

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.bold}>
            {mine ? t('Edite a sua avaliação') : t('Avalie este profissional')}
          </Text>
          <Stars value={stars} onChange={setStars} />
          <TextInput
            accessibilityLabel={t('Conte como foi (opcional)')}
            placeholder={t('Conte como foi (opcional)')}
            placeholderTextColor={fixed.gray}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            style={styles.input}
          />
          <Button label={t('Enviar avaliação')} onPress={() => void send()} loading={saving} />
          {editing ? (
            <Button variant="link" label={t('Cancelar')} onPress={() => setEditing(false)} />
          ) : null}
        </View>
      ) : null}
      {message ? <Text style={styles.muted}>{message}</Text> : null}

      {isClient && !bookingId && !mine ? (
        <Text style={styles.muted}>
          {t('Você poderá avaliar depois de concluir um agendamento.')}
        </Text>
      ) : null}

      {reviews.length ? (
        reviews.map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.avatarLetter, { color: theme.primary }]}>
                {review.author[0]}
              </Text>
            </View>
            <View style={styles.reviewBody}>
              <View style={styles.reviewHead}>
                <Text style={styles.author}>{review.author}</Text>
                <Text style={styles.muted}>{formatRelative(review.createdAt)}</Text>
              </View>
              <View style={styles.reviewMain}>
                <View style={styles.reviewContent}>
                  <Stars value={review.stars} />
                  {review.text ? <Text style={styles.muted}>{review.text}</Text> : null}
                </View>
                {review.id === uid ? (
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Editar')}
                      onPress={() => {
                        setStars(review.stars);
                        setText(review.text);
                        setMessage('');
                        setEditing(true);
                      }}
                      style={[styles.action, { backgroundColor: theme.primaryLight }]}
                    >
                      <MaterialIcons name="edit" size={18} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Excluir')}
                      onPress={remove}
                      style={[styles.action, { backgroundColor: fixed.dangerBg }]}
                    >
                      <MaterialIcons name="delete" size={18} color={fixed.danger} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{t('Ainda não há avaliações.')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 24 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  form: { gap: 12, padding: 16, borderWidth: 1, borderColor: fixed.borderSoft, borderRadius: 12 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    color: fixed.ink,
  },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4, marginBottom: 6 },
  bold: { fontWeight: '700', color: fixed.ink },
  author: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  review: { flexDirection: 'row', gap: 16 },
  reviewBody: { flex: 1 },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  reviewMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewContent: { flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 4 },
  action: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
