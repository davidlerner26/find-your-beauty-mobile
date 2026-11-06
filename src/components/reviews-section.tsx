import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';
import { t } from '../i18n';
import { Review } from '../models/professional';
import { completedBookingId, listReviews, removeReview, saveReview } from '../services/reviews';
import { fixed } from '../theme/colors';
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
            name={star <= value ? 'star' : 'star-border'}
            size={onChange ? 32 : 16}
            color={fixed.accent}
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
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{review.author[0]}</Text>
            </View>
            <View style={styles.reviewBody}>
              <View style={styles.reviewHead}>
                <Text style={styles.bold}>{review.author}</Text>
                <Text style={styles.muted}>{formatRelative(review.createdAt)}</Text>
              </View>
              <Stars value={review.stars} />
              {review.text ? <Text style={styles.muted}>{review.text}</Text> : null}
              {review.id === uid ? (
                <View style={styles.actions}>
                  <Button
                    variant="link"
                    label={t('Editar')}
                    onPress={() => {
                      setStars(review.stars);
                      setText(review.text);
                      setMessage('');
                      setEditing(true);
                    }}
                  />
                  <Button variant="link" label={t('Excluir')} onPress={remove} />
                </View>
              ) : null}
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
  section: { gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: fixed.ink },
  form: { gap: 10, padding: 14, borderWidth: 1, borderColor: fixed.borderSoft, borderRadius: 14 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: fixed.border,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    color: fixed.ink,
  },
  stars: { flexDirection: 'row', gap: 2 },
  bold: { fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  review: { flexDirection: 'row', gap: 12 },
  reviewBody: { flex: 1, gap: 2 },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '700', color: fixed.brand },
  actions: { flexDirection: 'row' },
});
