import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, List, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';

import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { createAddress, updateAddress } from '../services/address.api';
import type { UpsertAddressPayload } from '../types/address';
import type { RegionNode } from '../data/regions';
import { provinces as provinceList } from '../data/regions';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddressForm'>;

type FormValues = UpsertAddressPayload & { isDefault: boolean };

const defaultValues: FormValues = {
  contactName: '',
  contactPhone: '',
  province: '',
  city: '',
  district: '',
  street: '',
  detail: '',
  postalCode: '',
  isDefault: false,
  tag: '',
};

export default function AddressFormScreen({ route, navigation }: Props) {
  const { mode } = route.params;
  const editingAddress = mode === 'edit' ? route.params.address : undefined;
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
  });

  const [provinceNode, setProvinceNode] = useState<RegionNode | null>(null);
  const [cityNode, setCityNode] = useState<RegionNode | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerLevel, setPickerLevel] = useState<'province' | 'city' | 'district'>('province');

  const provinceOptions = useMemo(() => provinceList, []);
  const cityOptions = useMemo(() => provinceNode?.children ?? [], [provinceNode]);
  const districtOptions = useMemo(() => cityNode?.children ?? [], [cityNode]);

  const pickerOptions = useMemo(() => {
    switch (pickerLevel) {
      case 'province':
        return provinceOptions;
      case 'city':
        return cityOptions;
      case 'district':
        return districtOptions;
      default:
        return [];
    }
  }, [pickerLevel, provinceOptions, cityOptions, districtOptions]);

  const pickerTitle = useMemo(() => {
    switch (pickerLevel) {
      case 'province':
        return '选择省份';
      case 'city':
        return '选择城市';
      case 'district':
        return '选择区县';
      default:
        return '';
    }
  }, [pickerLevel]);

  useEffect(() => {
    if (mode === 'edit' && editingAddress) {
      const {
        contactName,
        contactPhone,
        province,
        city,
        district,
        street,
        detail,
        postalCode,
        isDefault,
        tag,
      } = editingAddress;
      setValue('contactName', contactName);
      setValue('contactPhone', contactPhone);
      setValue('street', street);
      setValue('detail', detail ?? '');
      setValue('postalCode', postalCode ?? '');
      setValue('isDefault', isDefault);
      setValue('tag', tag ?? '');

      const matchedProvince = provinceList.find((item) => item.name === province);
      if (matchedProvince) {
        setProvinceNode(matchedProvince);
        setValue('province', matchedProvince.name);
        const matchedCity = matchedProvince.children?.find((item: any) => item.name === city);
        if (matchedCity) {
          setCityNode(matchedCity);
          setValue('city', matchedCity.name);
          const matchedDistrict = matchedCity.children?.find((item: any) => item.name === district);
          if (matchedDistrict) {
            setValue('district', matchedDistrict.name);
          } else {
            setValue('district', district);
          }
        } else {
          setValue('city', city);
          setValue('district', district);
        }
      } else {
        setValue('province', province);
        setValue('city', city);
        setValue('district', district);
      }
    }
  }, [mode, editingAddress, setValue]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: UpsertAddressPayload) => createAddress(payload),
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpsertAddressPayload) => {
      if (!editingAddress) {
        throw new Error('地址不存在');
      }
      return updateAddress(editingAddress.id, payload);
    },
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
  });

  const openPicker = (level: 'province' | 'city' | 'district') => {
    Keyboard.dismiss();
    if (level === 'city' && !provinceNode) {
      setError('province', { type: 'manual', message: '请先选择省份' });
      return;
    }
    if (level === 'district') {
      if (!provinceNode) {
        setError('province', { type: 'manual', message: '请先选择省份' });
        return;
      }
      if (!cityNode) {
        setError('city', { type: 'manual', message: '请先选择城市' });
        return;
      }
    }
    setPickerLevel(level);
    setPickerVisible(true);
  };

  const handleSelectOption = (option: RegionNode) => {
    if (pickerLevel === 'province') {
      setProvinceNode(option);
      setCityNode(null);
      setValue('province', option.name, { shouldDirty: true, shouldValidate: true });
      setValue('city', '', { shouldDirty: true, shouldValidate: true });
      setValue('district', '', { shouldDirty: true, shouldValidate: true });
      clearErrors(['province', 'city', 'district']);
    } else if (pickerLevel === 'city') {
      setCityNode(option);
      setValue('city', option.name, { shouldDirty: true, shouldValidate: true });
      setValue('district', '', { shouldDirty: true, shouldValidate: true });
      clearErrors(['city', 'district']);
    } else if (pickerLevel === 'district') {
      setValue('district', option.name, { shouldDirty: true, shouldValidate: true });
      clearErrors('district');
    }
    setPickerVisible(false);
  };

  const onSubmit = (values: FormValues) => {
    const payload: UpsertAddressPayload = {
      contactName: values.contactName.trim(),
      contactPhone: values.contactPhone.trim(),
      province: values.province.trim(),
      city: values.city.trim(),
      district: values.district.trim(),
      street: values.street.trim(),
      detail: values.detail?.trim() || undefined,
      postalCode: values.postalCode?.trim() || undefined,
      isDefault: values.isDefault,
      tag: values.tag?.trim() || undefined,
    };

    if (mode === 'edit' && editingAddress) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const submitting = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="contactName"
          rules={{ required: '请输入收货人姓名' }}
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="收货人"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                error={!!errors.contactName}
              />
            );
          }}
        />
        {errors.contactName ? <HelperText type="error">{errors.contactName.message}</HelperText> : null}
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="contactPhone"
          rules={{
            required: '请输入手机号',
            pattern: {
              value: /^1\d{10}$/,
              message: '手机号格式不正确',
            },
          }}
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="手机号"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="phone-pad"
                error={!!errors.contactPhone}
              />
            );
          }}
        />
        {errors.contactPhone ? <HelperText type="error">{errors.contactPhone.message}</HelperText> : null}
      </View>

      <View style={styles.inlineGroup}>
        <View style={styles.flexItem}>
          <Controller
            control={control}
            name="province"
          rules={{ required: '请选择省份' }}
            render={({ field: { value } }) => (
              <View style={styles.regionField}>
                <Text style={styles.regionLabel}>省份</Text>
                <Button
                  mode="outlined"
                  onPress={() => openPicker('province')}
                  style={styles.regionButton}
                  contentStyle={styles.regionButtonContent}
                >
                  {value || '请选择省份'}
                </Button>
                {errors.province ? <HelperText type="error">{errors.province.message}</HelperText> : null}
              </View>
            )}
          />
        </View>
        <View style={styles.flexItem}>
          <Controller
            control={control}
            name="city"
          rules={{ required: '请选择城市' }}
            render={({ field: { value } }) => (
              <View style={styles.regionField}>
                <Text style={styles.regionLabel}>城市</Text>
                <Button
                  mode="outlined"
                  onPress={() => openPicker('city')}
                  style={styles.regionButton}
                  contentStyle={styles.regionButtonContent}
                  disabled={!provinceNode}
                >
                  {value || '请选择城市'}
                </Button>
                {errors.city ? <HelperText type="error">{errors.city.message}</HelperText> : null}
              </View>
            )}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="district"
        rules={{ required: '请选择区/县' }}
          render={({ field: { value } }) => (
            <View style={styles.regionField}>
              <Text style={styles.regionLabel}>区县</Text>
              <Button
                mode="outlined"
                onPress={() => openPicker('district')}
                style={styles.regionButton}
                contentStyle={styles.regionButtonContent}
                disabled={!provinceNode || !cityNode}
              >
                {value || '请选择区县'}
              </Button>
              {errors.district ? <HelperText type="error">{errors.district.message}</HelperText> : null}
            </View>
          )}
        />
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="street"
          rules={{ required: '请输入详细地址' }}
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="街道"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                error={!!errors.street}
              />
            );
          }}
        />
        {errors.street ? <HelperText type="error">{errors.street.message}</HelperText> : null}
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="detail"
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="楼栋/门牌号（可选）"
                value={value}
                onChangeText={onChange}
                mode="outlined"
              />
            );
          }}
        />
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="postalCode"
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="邮编（可选）"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="number-pad"
              />
            );
          }}
        />
      </View>

      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="tag"
          render={({ field }) => {
            const { onChange, value } = field;
            return (
              <TextInput
                label="地址标签（如 家/公司）"
                value={value}
                onChangeText={onChange}
                mode="outlined"
              />
            );
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text>设为默认地址</Text>
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => {
            const { onChange, value } = field;
            return <Switch value={value} onValueChange={onChange} />;
          }}
        />
      </View>

      <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={submitting} disabled={submitting}>
        {mode === 'edit' ? '保存修改' : '新增地址'}
      </Button>

      <Portal>
        <Dialog visible={pickerVisible} onDismiss={() => setPickerVisible(false)}>
          <Dialog.Title>{pickerTitle}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <ScrollView>
              {pickerOptions.map((option) => (
                <List.Item key={option.code} title={option.name} onPress={() => handleSelectOption(option)} />
              ))}
              {pickerOptions.length === 0 ? (
                <View style={styles.emptyResult}>
                  <Text variant="bodySmall">暂无可选项</Text>
                </View>
              ) : null}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPickerVisible(false)}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f3',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  formGroup: {
    gap: 4,
  },
  inlineGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  flexItem: {
    flex: 1,
    gap: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionField: {
    gap: 4,
  },
  regionLabel: {
    color: '#555',
    marginBottom: 4,
  },
  regionButton: {
    borderRadius: 8,
  },
  regionButtonContent: {
    justifyContent: 'flex-start',
  },
  dialogContent: {
    maxHeight: 320,
    paddingHorizontal: 0,
  },
  emptyResult: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});


