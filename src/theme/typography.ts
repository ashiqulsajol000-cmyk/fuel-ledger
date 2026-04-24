import { Platform, TextStyle } from 'react-native';

const systemSerif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const systemSans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: systemSerif,
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
  } as TextStyle,
  title: {
    fontFamily: systemSerif,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,
  heading: {
    fontFamily: systemSans,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.1,
  } as TextStyle,
  subheading: {
    fontFamily: systemSans,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  body: {
    fontFamily: systemSans,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  label: {
    fontFamily: systemSans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
  caption: {
    fontFamily: systemSans,
    fontSize: 12,
    fontWeight: '400',
  } as TextStyle,
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
  } as TextStyle,
};
