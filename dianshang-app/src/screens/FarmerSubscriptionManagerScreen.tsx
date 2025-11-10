import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { useAuthStore } from '../store/authStore';
import {
  createSubscriptionPlan,
  fetchFarmerSubscriptionPlans,
  updateSubscriptionPlan,
} from '../services/subscription.api';
import type {
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  SubscriptionCycle,
  UpdateSubscriptionPlanPayload,
} from '../types/subscription';

const cycleOptions: { label: string; value: SubscriptionCycle }[] = [
  { label: '每周', value: 'weekly' },
  { label: '隔周', value: 'biweekly' },
  { label: '每月', value: 'monthly' },
  { label: '当季', value: 'seasonal' },
];

type PlanFormValues = {
  title: string;
  subtitle?: string;
  price: string;
  cycle: SubscriptionCycle;
  deliverWeekday?: string;
  description?: string;
  benefitsText?: string;
  itemsText?: string;
};

export default function FarmerSubscriptionManagerScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['farmer-subscription-plans'],
    queryFn: fetchFarmerSubscriptionPlans,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<PlanFormValues>({
    defaultValues: {
      title: '',
      subtitle: '',
      price: '',
      cycle: 'weekly',
      deliverWeekday: '5',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubscriptionPlanPayload) => createSubscriptionPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      Alert.alert('创建成功', '订阅计划已发布。');
      reset({ title: '', subtitle: '', price: '', cycle: 'weekly', deliverWeekday: '5', description: '' });
    },
    onError: (error: any) => {
      Alert.alert('创建失败', error?.response?.data?.message ?? '请稍后再试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: UpdateSubscriptionPlanPayload }) =>
      updateSubscriptionPlan(planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: any) => {
      Alert.alert('操作失败', error?.response?.data?.message ?? '请稍后再试');
    },
  });

  const onSubmit = (values: PlanFormValues) => {
    const payload: CreateSubscriptionPlanPayload = {
      title: values.title.trim(),
      subtitle: values.subtitle?.trim() || undefined,
      price: Number(values.price),
      cycle: values.cycle,
      description: values.description?.trim() || undefined,
      deliverWeekday: values.deliverWeekday ? Number(values.deliverWeekday) : undefined,
      farmerId: user?.farmerProfileId,
    };

    if (Number.isNaN(payload.price)) {
      Alert.alert('提示', '请输入正确的价格');
      return;
    }

    if (values.benefitsText) {
      payload.benefits = values.benefitsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (values.itemsText) {
      payload.items = values.itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, quantity, description] = line.split('|');
          return { name, quantity, description };
        });
    }

    createMutation.mutate(payload);
  };

  const handleTogglePlan = (plan: SubscriptionPlan) => {
    updateMutation.mutate({
      planId: plan.id,
      payload: { isActive: !plan.isActive },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>创建订阅计划</Text>

      <Controller
        control={control}
        name="title"
        rules={{ required: '请输入方案名称' }}
        render={({ field: { value, onChange }, fieldState }) => (
          <TextInput
            label="方案名称"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            error={Boolean(fieldState.error)}
          />
        )}
      />

      <Controller
        control={control}
        name="subtitle"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="副标题"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
          />
        )}
      />

      <Controller
        control={control}
        name="price"
        rules={{ required: '请输入价格' }}
        render={({ field: { value, onChange }, fieldState }) => (
          <TextInput
            label="价格（元）"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            error={Boolean(fieldState.error)}
          />
        )}
      />

      <Text style={styles.label}>配送周期</Text>
      <View style={styles.cycleRow}>
        {cycleOptions.map((option) => (
          <Chip
            key={option.value}
            selected={watch('cycle') === option.value}
            onPress={() => setValue('cycle', option.value)}
            style={styles.cycleChip}
          >
            {option.label}
          </Chip>
        ))}
      </View>

      <Controller
        control={control}
        name="deliverWeekday"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="配送星期（0-6，可选）"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            keyboardType="number-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="方案介绍"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Controller
        control={control}
        name="benefitsText"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="亮点（每行一个）"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Controller
        control={control}
        name="itemsText"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="箱内明细（格式：品名|数量|说明，每行一条）"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
          />
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || createMutation.isPending}
        disabled={createMutation.isPending}
        style={styles.submitButton}
      >
        发布订阅计划
      </Button>

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionTitle}>已发布计划</Text>
      {isLoading ? (
        <Text style={styles.hintText}>加载中...</Text>
      ) : isError ? (
        <Text style={styles.errorText}>获取订阅计划失败，请稍后再试。</Text>
      ) : data && data.length > 0 ? (
        data.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Chip style={styles.statusChip} selectedColor={plan.isActive ? '#2e7d32' : '#d32f2f'}>
                {plan.isActive ? '已上架' : '已停用'}
              </Chip>
            </View>
            {plan.subtitle && <Text style={styles.planSubtitle}>{plan.subtitle}</Text>}
            <Text style={styles.planPrice}>￥{plan.price.toFixed(2)}</Text>
            <Text style={styles.planMeta}>
              {cycleOptions.find((opt) => opt.value === plan.cycle)?.label ?? plan.cycle}
            </Text>
            <Button
              mode="outlined"
              style={styles.pauseButton}
              onPress={() => handleTogglePlan(plan)}
              loading={updateMutation.isPending}
            >
              {plan.isActive ? '暂停订阅' : '重新上架'}
            </Button>
          </View>
        ))
      ) : (
        <Text style={styles.hintText}>尚未创建订阅计划。</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e5436',
  },
  input: {
    marginTop: 8,
  },
  label: {
    marginTop: 12,
    color: '#546e7a',
    fontWeight: '600',
  },
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  cycleChip: {
    backgroundColor: '#f1f8e9',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#dce0d9',
    marginVertical: 12,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dce0d9',
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f3d2b',
  },
  planSubtitle: {
    marginTop: 4,
    color: '#607d8b',
  },
  planPrice: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#d32f2f',
  },
  planMeta: {
    marginTop: 6,
    color: '#78909c',
  },
  statusChip: {
    backgroundColor: '#e8f5e9',
  },
  pauseButton: {
    marginTop: 12,
    borderRadius: 10,
  },
  hintText: {
    color: '#78909c',
  },
  errorText: {
    color: '#d32f2f',
  },
});
