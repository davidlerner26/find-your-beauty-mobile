import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/button';
import { GoogleButton } from '../components/google-button';
import { Link } from '../components/link';
import { Shade } from '../components/shade';
import { Text } from '../components/text';
import { useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { fixed, radius } from '../theme/colors';
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

// The first visit: a photo on the whole screen and four steps; the last one asks to sign up (it has no dots)
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useAuthActions();
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const last = current === STEPS.length - 1;
  const beforeLast = current === STEPS.length - 2;

  return (
    <View style={styles.screen}>
      <Image
        accessibilityIgnoresInvertColors
        source={step.image}
        contentFit="cover"
        contentPosition="top"
        transition={300}
        style={StyleSheet.absoluteFill}
      />
      <Shade />

      <View style={[styles.panel, { paddingBottom: 32 + insets.bottom }]}>
        <Text accessibilityRole="header" style={styles.title}>
          {step.title()}
        </Text>
        <Text style={styles.description}>{step.description()}</Text>

        {last ? (
          <>
            <GoogleButton
              onDark
              label={t('Entrar com Google')}
              run={async () => {
                const signedIn = await signInWithGoogle('client');
                if (signedIn) router.replace(PATHS.home as never);
                return signedIn;
              }}
            />
            <Button
              label={t('Entrar com e-mail')}
              onPress={() => router.replace(PATHS.signup as never)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Continuar como visitante')}
              onPress={() => router.replace(PATHS.home as never)}
              style={styles.visitor}
            >
              <Text style={styles.visitorLabel}>{t('Continuar como visitante')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.dots} accessibilityLabel={t('Passo {{n}}', { n: current + 1 })}>
              {STEPS.slice(0, -1).map((_, n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={t('Passo {{n}}', { n: n + 1 })}
                  hitSlop={8}
                  onPress={() => setCurrent(n)}
                  style={[
                    styles.dot,
                    n === current && [styles.dotOn, { backgroundColor: fixed.accent }],
                  ]}
                />
              ))}
            </View>
            <Button
              label={beforeLast ? t('Começar') : t('Próximo')}
              onPress={() => setCurrent((n) => n + 1)}
            />
          </>
        )}

        <Text style={styles.signin}>
          {t('Já tem uma conta?')}{' '}
          <Link href={PATHS.login as never} accessibilityRole="link" style={styles.signinLink}>
            {t('Entrar')}
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', backgroundColor: fixed.surface },
  panel: { paddingHorizontal: 24, paddingTop: 32, gap: 16 },
  title: { fontSize: 32, fontWeight: '700', color: fixed.white, textAlign: 'center' },
  description: { fontSize: 18, lineHeight: 27, color: fixed.white, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: fixed.white },
  dotOn: { width: 36 },
  visitor: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: fixed.white,
    borderRadius: radius.pill,
  },
  visitorLabel: { fontSize: 17, color: fixed.white },
  signin: { color: fixed.white, textAlign: 'center', marginTop: 8 },
  signinLink: { fontWeight: '600', color: fixed.accent },
});
