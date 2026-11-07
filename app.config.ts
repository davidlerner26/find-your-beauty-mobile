import { ConfigContext, ExpoConfig } from 'expo/config';

// The address that Google opens to get back to the iOS app: the iOS client id, written backwards
// ("123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc")
export const googleUrlScheme = (iosClientId: string) =>
  `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`;

// The OAuth client of Google for iOS: the test project by default, the production one through the environment of
// the build (the same variable the app reads). The rest of the configuration is in app.json.
const DEV_IOS_CLIENT_ID =
  '508397329043-1ns5lec0e73406h95r0dtq73tat9r06k.apps.googleusercontent.com';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleUrlScheme(
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? DEV_IOS_CLIENT_ID,
        ),
      },
    ],
  ],
});
