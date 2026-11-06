import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { Screen } from '../components/screen';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { PATHS } from '../utils/paths';

const STEPS = [
  {
    title: () => t('O melhor profissional para você'),
    description: () => t('Realce sua beleza de acordo com o seu estilo de vida'),
    image: require('../../assets/images/makeup/1.jpg'),
  },
  {
    title: () => t('Conheça nossos especialistas'),
    description: () => t('Há muitos profissionais incríveis para escolher, todos perto de você'),
    image: require('../../assets/images/makeup/2.jpg'),
  },
  {
    title: () => t('Encontre o melhor serviço'),
    description: () => t('Vários serviços dos melhores profissionais que são nossos parceiros'),
    image: require('../../assets/images/makeup/3.jpg'),
  },
  {
    title: () => t('Junte-se a nós'),
    description: () => t('Encontre e agende maquiagem e penteado onde e quando quiser'),
    image: require('../../assets/images/makeup/4.jpg'),
  },
];

// The first visit: four steps, the last one asks to sign up
export default function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const last = current === STEPS.length - 1;

  return (
    <Screen scroll={false} padded={false}>
      <Image
        accessibilityIgnoresInvertColors
        source={step.image}
        contentFit="cover"
        style={styles.image}
        accessibilityLabel=""
      />
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>
          {step.title()}
        </Text>
        <Text style={styles.muted}>{step.description()}</Text>

        {!last ? (
          <View style={styles.dots} accessibilityLabel={t('Passo {{n}}', { n: current + 1 })}>
            {STEPS.slice(0, -1).map((_, n) => (
              <View key={n} style={[styles.dot, n === current && styles.dotOn]} />
            ))}
          </View>
        ) : null}

        {last ? (
          <>
            <Button
              label={t('Criar conta')}
              onPress={() => router.replace(PATHS.signup as never)}
            />
            <Button
              variant="outline"
              label={t('Entrar')}
              onPress={() => router.replace(PATHS.login as never)}
            />
            <Link href={PATHS.home as never} accessibilityRole="link" style={styles.skip}>
              {t('Entrar sem conta')}
            </Link>
          </>
        ) : (
          <>
            <Button label={t('Próximo')} onPress={() => setCurrent((n) => n + 1)} />
            <Button
              variant="link"
              label={t('Pular')}
              onPress={() => setCurrent(STEPS.length - 1)}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { flex: 1 },
  body: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray, fontSize: 16 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: fixed.border },
  dotOn: { backgroundColor: fixed.brand },
  skip: { color: fixed.accentText, fontWeight: '600', textAlign: 'center', padding: 8 },
});
