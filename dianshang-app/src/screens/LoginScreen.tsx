import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { loginApi } from '../services/auth.api';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type LoginForm = {
  phone: string;
  password: string;
};

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState<LoginForm>({ phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: async (data) => {
      await login({ user: data.user, token: data.accessToken });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err.message ?? '登录失败';
      setError(message);
    },
  });

  const handleChange = (field: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setError(null);
    mutation.mutate(form);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        欢迎回来
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        使用手机号和密码登录，继续选购新鲜农产品
      </Text>

      <TextInput
        mode="outlined"
        label="手机号"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(value) => handleChange('phone', value)}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="密码"
        secureTextEntry
        value={form.password}
        onChangeText={(value) => handleChange('password', value)}
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={mutation.isPending}
        disabled={mutation.isPending}
      >
        登录
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
        <Text variant="bodyMedium" style={styles.linkText}>
          还没有账号？前往注册
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: '#f6f9f3',
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#2e7d32',
  },
  error: {
    color: '#d32f2f',
  },
});

