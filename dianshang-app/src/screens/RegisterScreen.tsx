import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { registerApi } from '../services/auth.api';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type RegisterForm = {
  phone: string;
  password: string;
  confirmPassword: string;
  name: string;
};

export default function RegisterScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState<RegisterForm>({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: RegisterForm) => {
      if (!payload.phone || !payload.password) {
        throw new Error('请填写完整信息');
      }
      if (payload.password !== payload.confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }
      return registerApi({ phone: payload.phone, password: payload.password, name: payload.name });
    },
    onSuccess: async (data) => {
      await login({ user: data.user, token: data.accessToken });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err.message ?? '注册失败';
      setError(message);
    },
  });

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setError(null);
    mutation.mutate(form);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        注册成为会员
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        完善信息后即可享受个性化推荐与会员权益
      </Text>

      <TextInput
        mode="outlined"
        label="姓名（选填）"
        value={form.name}
        onChangeText={(value) => handleChange('name', value)}
        style={styles.input}
      />
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
      <TextInput
        mode="outlined"
        label="确认密码"
        secureTextEntry
        value={form.confirmPassword}
        onChangeText={(value) => handleChange('confirmPassword', value)}
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
        完成注册并登录
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()}>
        已有账号？返回登录
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
  error: {
    color: '#d32f2f',
  },
});

