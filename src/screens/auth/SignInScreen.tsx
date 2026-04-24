import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors, radii, spacing, typography } from '../../theme';
import { hasSupabaseConfig } from '../../lib/supabase';

type Mode = 'signin' | 'signup';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!hasSupabaseConfig) {
      setError(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }
    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } =
        mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
      if (error) {
        setError(error);
      } else if (mode === 'signup') {
        setInfo('Account created. Check your email if confirmation is required, then sign in.');
        setMode('signin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(212,175,55,0.18)', 'transparent']}
          style={styles.heroGlow}
        />
        <View style={styles.logo}>
          <Ionicons name="car-sport" size={28} color={colors.gold} />
        </View>
        <Text style={styles.brand}>FUEL LEDGER</Text>
        <Text style={styles.title}>
          {mode === 'signin' ? 'Welcome back.' : 'Track every drop.'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to access your fleet, fuel logs, and maintenance history.'
            : 'Create an account to start tracking fuel, mileage, and maintenance with precision.'}
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Button
          title={mode === 'signin' ? 'Sign In' : 'Create Account'}
          onPress={submit}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />
        <Pressable
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
          style={styles.switch}
        >
          <Text style={styles.switchText}>
            {mode === 'signin'
              ? "Don't have an account?  "
              : 'Already have an account?  '}
            <Text style={styles.switchAction}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    left: -80,
    right: -80,
    height: 260,
    borderRadius: 200,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brand: {
    ...typography.label,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  form: {
    marginTop: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  info: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  switchText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  switchAction: {
    color: colors.gold,
    fontWeight: '700',
  },
});
