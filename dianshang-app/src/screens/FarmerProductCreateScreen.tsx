import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  HelperText,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  createProduct,
  fetchProductDetail,
  updateProduct,
  updateProductStatus,
  type CreateProductPayload,
  type ProductStatus,
  type UpdateProductPayload,
} from '../services/product.api';
import { uploadImageFromUri } from '../services/upload.api';
import { mockCategories } from '../utils/mockData';
import type { ProfileStackParamList } from '../navigation/AppNavigator';

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: '已上架' },
  { value: 'inactive', label: '已下架' },
  { value: 'draft', label: '草稿' },
];

const MAX_IMAGES = 9;

type FormValues = {
  name: string;
  description: string;
  images: string[];
  price: string;
  originalPrice: string;
  unit: string;
  origin: string;
  categoryId: string;
  seasonalTag: string;
  stock: string;
  isOrganic: boolean;
  status: ProductStatus;
};

const defaultValues: FormValues = {
  name: '',
  description: '',
  images: [],
  price: '',
  originalPrice: '',
  unit: '',
  origin: '',
  categoryId: mockCategories[0]?.id ?? '',
  seasonalTag: '',
  stock: '0',
  isOrganic: false,
  status: 'active',
};

type CreateProps = NativeStackScreenProps<ProfileStackParamList, 'FarmerProductCreate'>;
type EditProps = NativeStackScreenProps<ProfileStackParamList, 'FarmerProductEdit'>;
type Props = CreateProps | EditProps;

export default function FarmerProductCreateScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);
  const [initialStatus, setInitialStatus] = useState<ProductStatus | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const previewScrollRef = useRef<ScrollView>(null);

  const isEditMode = route.name === 'FarmerProductEdit' || !!route.params?.productId;
  const productId = route.name === 'FarmerProductEdit' ? route.params.productId : route.params?.productId;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
    register,
  } = useForm<FormValues>({ defaultValues });

  useEffect(() => {
    register('images');
    register('status');
  }, [register]);

  const images = watch('images');
  const primaryImage = images[0];
  const statusValue = watch('status');

  const productQuery = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => fetchProductDetail(productId as string),
    enabled: isEditMode && !!productId,
  });

  useEffect(() => {
    if (productQuery.data && isEditMode) {
      const product = productQuery.data;
      reset({
        name: product.name,
        description: product.description ?? '',
        images: product.images ?? [],
        price: product.price ? product.price.toString() : '',
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        unit: product.unit,
        origin: product.origin,
        categoryId: product.categoryId,
        seasonalTag: product.seasonalTag ?? '',
        stock: product.stock.toString(),
        isOrganic: product.isOrganic ?? false,
        status: product.status,
      });
      setInitialStatus(product.status);
      setActiveImageIndex(0);
    }
  }, [productQuery.data, isEditMode, reset]);

  useEffect(() => {
    if (isEditMode) {
      navigation.setOptions({ title: '编辑商品' });
    }
  }, [isEditMode, navigation]);

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
    if (productId) {
      queryClient.invalidateQueries({ queryKey: ['product-detail', productId] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: (product) => {
      setSnackbarMessage(`商品「${product.name}」已上架`);
      invalidateProductQueries();
      reset(defaultValues);
      setInitialStatus('active');
      setActiveImageIndex(0);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '上架失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId: id, payload }: { productId: string; payload: UpdateProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: (product) => {
      setSnackbarMessage(`商品「${product.name}」已更新`);
      invalidateProductQueries();
      setInitialStatus(product.status);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '更新失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ productId: id, status }: { productId: string; status: ProductStatus }) =>
      updateProductStatus(id, status),
    onSuccess: (product) => {
      setSnackbarMessage(`商品状态已更新为${statusOptions.find((item) => item.value === product.status)?.label ?? ''}`);
      invalidateProductQueries();
      setInitialStatus(product.status);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? '更新状态失败，请稍后重试';
      setSnackbarMessage(message);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || updateStatusMutation.isPending;
  const isLoading = isEditMode && productQuery.isLoading;
  const loadError = isEditMode && productQuery.isError;

  const ensureImagesValid = (currentImages: string[]) => {
    if (!currentImages || currentImages.length === 0) {
      setSnackbarMessage('请至少添加一张商品图片');
      setError('images', { type: 'manual', message: '请至少添加一张商品图片' });
      setImageDialogVisible(true);
      return false;
    }
    return true;
  };

  const onSubmit = async (values: FormValues) => {
    const sanitizedImages = values.images.map((url) => url.trim()).filter(Boolean);
    if (!ensureImagesValid(sanitizedImages)) {
      return;
    }

    const priceNumber = Number(values.price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError('price', { type: 'manual', message: '售价必须大于 0' });
      return;
    }

    const stockNumber = Number.parseInt(values.stock, 10);
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      setError('stock', { type: 'manual', message: '库存必须为非负整数' });
      return;
    }

    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setError('name', { type: 'manual', message: '请输入商品名称' });
      return;
    }

    const updatePayload: UpdateProductPayload = {
      name: trimmedName,
      description: values.description?.trim() || undefined,
      images: sanitizedImages,
      price: Number(priceNumber.toFixed(2)),
      originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
      unit: values.unit.trim(),
      origin: values.origin.trim(),
      categoryId: values.categoryId,
      seasonalTag: values.seasonalTag.trim() || undefined,
      isOrganic: values.isOrganic,
      stock: stockNumber,
    };

    try {
      if (isEditMode && productId) {
        await updateMutation.mutateAsync({ productId, payload: updatePayload });
        if (initialStatus && values.status !== initialStatus) {
          await updateStatusMutation.mutateAsync({ productId, status: values.status });
        }
      } else {
        const createPayload: CreateProductPayload = {
          name: trimmedName,
          description: values.description?.trim() || undefined,
          images: sanitizedImages,
          price: Number(priceNumber.toFixed(2)),
          originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
          unit: values.unit.trim(),
          origin: values.origin.trim(),
          categoryId: values.categoryId,
          seasonalTag: values.seasonalTag.trim() || undefined,
          isOrganic: values.isOrganic,
          stock: stockNumber,
          status: values.status,
        };
        await createMutation.mutateAsync(createPayload);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? '提交失败，请稍后重试';
      setSnackbarMessage(message);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setValue('categoryId', categoryId, { shouldDirty: true });
  };

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSnackbarMessage('请在设置中允许访问相册');
      return false;
    }
    return true;
  };

  const handleAddImage = (url: string) => {
    if (images.length >= MAX_IMAGES) {
      setSnackbarMessage(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }
    const nextImages = Array.from(new Set([...images, url])).slice(0, MAX_IMAGES);
    setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
    clearErrors('images');
    setActiveImageIndex(0);
  };

  const handlePickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      setSnackbarMessage(`最多只能上传 ${MAX_IMAGES} 张图片`);
      setImageDialogVisible(false);
      return;
    }
    const granted = await requestLibraryPermission();
    if (!granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    await uploadAssetToOss(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      setSnackbarMessage(`最多只能上传 ${MAX_IMAGES} 张图片`);
      setImageDialogVisible(false);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setSnackbarMessage('请授权访问相机');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    await uploadAssetToOss(result.assets[0]);
  };

  const uploadAssetToOss = async (asset: ImagePickerAsset) => {
    console.log('[upload] 选中资源', asset);
    const fileName = asset.fileName ?? `upload-${Date.now()}.jpg`;
    const contentType = asset.mimeType ?? 'image/jpeg';

    setUploadingImage(true);
    try {
      const uploadResult = await uploadImageFromUri(asset.uri, {
        fileName,
        fileType: contentType,
        directory: 'products',
      });

      console.log('[upload] 上传成功结果', uploadResult);
      handleAddImage(uploadResult.url);
      setSnackbarMessage('图片上传成功');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? '图片上传失败，请稍后重试';
      console.error('[upload] 上传失败', error);
      setSnackbarMessage(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = images.filter((_, idx) => idx !== index);
    setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
    if (nextImages.length === 0) {
      setError('images', { type: 'manual', message: '请至少添加一张商品图片' });
      setActiveImageIndex(0);
    } else if (activeImageIndex >= nextImages.length) {
      setActiveImageIndex(nextImages.length - 1);
    }
  };

  const handleSetCover = (index: number) => {
    if (index === 0) {
      return;
    }
    const nextImages = [images[index], ...images.filter((_, idx) => idx !== index)];
    setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
    setActiveImageIndex(0);
  };

  const openPreview = (index: number) => {
    if (images.length === 0) {
      return;
    }
    setPreviewStartIndex(index);
    setPreviewVisible(true);
    requestAnimationFrame(() => {
      previewScrollRef.current?.scrollTo({ x: index * Dimensions.get('window').width, animated: false });
    });
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  const handleCarouselScroll = (event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const index = Math.round(contentOffset.x / layoutMeasurement.width);
    if (!Number.isNaN(index) && index >= 0 && index < images.length) {
      setActiveImageIndex(index);
    }
  };

  useEffect(() => {
    if (activeImageIndex >= images.length) {
      setActiveImageIndex(images.length > 0 ? images.length - 1 : 0);
    }
  }, [images, activeImageIndex]);

  const renderImageGrid = useMemo(() => {
    if (images.length === 0) {
      return null;
    }
    return (
      <View style={styles.imagesGrid}>
        {images.length < MAX_IMAGES ? (
          <TouchableOpacity
            style={styles.addImageItem}
            activeOpacity={0.8}
            onPress={() => setImageDialogVisible(true)}
          >
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addHint}>添加照片</Text>
            <Text style={styles.addCount}>
              {images.length}/{MAX_IMAGES}
            </Text>
          </TouchableOpacity>
        ) : null}
        {images.map((img, index) => (
          <View key={`${img}-${index}`} style={styles.imageItem}>
            <TouchableOpacity onPress={() => openPreview(index)} activeOpacity={0.9}>
              <Image source={{ uri: img }} style={styles.galleryImage} />
              {index === 0 ? <Text style={styles.coverBadge}>主图</Text> : null}
            </TouchableOpacity>
            <View style={styles.imageActions}>
              {index !== 0 ? (
                <Button mode="text" compact onPress={() => handleSetCover(index)}>
                  设为主图
                </Button>
              ) : null}
              <Button mode="text" compact onPress={() => handleRemoveImage(index)}>
                移除
              </Button>
            </View>
          </View>
        ))}
      </View>
    );
  }, [images]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingHint}>正在加载商品信息…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleMedium">商品信息加载失败</Text>
        <HelperText type="error">请检查网络后重试</HelperText>
        <Button mode="text" onPress={() => productQuery.refetch()}>
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          商品主图
        </Text>

        <TouchableOpacity onPress={() => (images.length > 0 ? openPreview(activeImageIndex) : setImageDialogVisible(true))} activeOpacity={0.8} style={styles.imageCard}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
            >
              {images.map((img, index) => (
                <TouchableOpacity key={`${img}-${index}`} activeOpacity={0.9} onPress={() => openPreview(index)}>
                  <Image source={{ uri: img }} style={styles.imagePreview} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>点击上传商品主图</Text>
              <Text style={styles.imagePlaceholderHint}>支持相册上传或粘贴图片链接</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.images ? <HelperText type="error">{errors.images.message}</HelperText> : null}

        {images.length > 0 ? (
          <View style={styles.imageMetaBox}>
            <View style={styles.imageMetaHeader}>
              <Text style={styles.imageMetaLabel}>图集 ({images.length})</Text>
              <Button mode="text" onPress={() => setImageDialogVisible(true)} compact>
                添加更多
              </Button>
            </View>
            <View style={styles.carouselDots}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === activeImageIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {renderImageGrid}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          基础信息
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: '请输入商品名称' }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="商品名称"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.name}
              style={styles.input}
            />
          )}
        />
        {errors.name ? <HelperText type="error">{errors.name.message}</HelperText> : null}

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="商品描述（可选）"
              mode="outlined"
              multiline
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          定价与库存
        </Text>
        <Controller
          control={control}
          name="price"
          rules={{ required: '请输入售价' }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="销售价 (¥)"
              mode="outlined"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              error={!!errors.price}
              style={styles.input}
            />
          )}
        />
        {errors.price ? <HelperText type="error">{errors.price.message}</HelperText> : null}

        <Controller
          control={control}
          name="originalPrice"
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="划线价 (可选)"
              mode="outlined"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />

        <Controller
          control={control}
          name="stock"
          rules={{ required: '请输入库存数量' }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="库存数量"
              mode="outlined"
              keyboardType="number-pad"
              value={value}
              onChangeText={onChange}
              error={!!errors.stock}
              style={styles.input}
            />
          )}
        />
        {errors.stock ? <HelperText type="error">{errors.stock.message}</HelperText> : null}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          销售信息
        </Text>

        <Controller
          control={control}
          name="unit"
          rules={{ required: '请输入计量单位' }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="计量单位"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.unit}
              style={styles.input}
              placeholder="如：箱、斤、袋"
            />
          )}
        />
        {errors.unit ? <HelperText type="error">{errors.unit.message}</HelperText> : null}

        <Controller
          control={control}
          name="origin"
          rules={{ required: '请输入产地' }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="产地"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.origin}
              style={styles.input}
              placeholder="例如：江西赣州"
            />
          )}
        />
        {errors.origin ? <HelperText type="error">{errors.origin.message}</HelperText> : null}

        <Text style={styles.helperLabel}>选择类目</Text>
        <View style={styles.categoryChips}>
          {mockCategories.map((category) => {
            const selected = watch('categoryId') === category.id;
            return (
              <Button
                key={category.id}
                mode={selected ? 'contained' : 'outlined'}
                compact
                onPress={() => handleSelectCategory(category.id)}
                style={styles.categoryButton}
              >
                {category.name}
              </Button>
            );
          })}
        </View>

        <Controller
          control={control}
          name="seasonalTag"
          render={({ field: { value, onChange } }) => (
            <TextInput
              label="标签（可选）"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              placeholder="如：当季热卖"
            />
          )}
        />

        <View style={styles.switchRow}>
          <Text>有机认证</Text>
          <Controller
            control={control}
            name="isOrganic"
            render={({ field: { value, onChange } }) => (
              <Switch value={value} onValueChange={onChange} color={theme.colors.primary} />
            )}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          商品状态
        </Text>
        <SegmentedButtons
          value={statusValue}
          onValueChange={(value) => setValue('status', value as ProductStatus, { shouldDirty: true })}
          buttons={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
        />
        <HelperText type="info">草稿状态不会在前台展示，已下架商品保留库存和信息。</HelperText>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
      >
        {isEditMode ? '保存修改' : '确认上架'}
      </Button>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={2500}>
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog visible={imageDialogVisible} onDismiss={() => setImageDialogVisible(false)}>
          <Dialog.Title>上传商品图片</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogActionsColumn}>
              <Button
                mode="contained"
                icon="image"
                onPress={handlePickImage}
                disabled={uploadingImage || images.length >= MAX_IMAGES}
                style={styles.dialogButton}
              >
                {uploadingImage ? '处理中…' : '从相册选择'}
              </Button>
              <Button
                mode="contained"
                icon="camera"
                onPress={handleTakePhoto}
                disabled={uploadingImage || images.length >= MAX_IMAGES}
                style={styles.dialogButton}
              >
                {uploadingImage ? '处理中…' : '拍照'}
              </Button>
              <HelperText type="info" visible>
                最多可上传 {MAX_IMAGES} 张图片，第一张默认作为主图。
              </HelperText>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImageDialogVisible(false)} disabled={uploadingImage}>
              取消
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.previewOverlay}>
          <ScrollView
            horizontal
            pagingEnabled
            ref={previewScrollRef}
            showsHorizontalScrollIndicator={false}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={`${img}-${index}`}
                activeOpacity={1}
                style={styles.previewSlide}
                onPress={closePreview}
              >
                <Image source={{ uri: img }} style={styles.previewImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button mode="contained" style={styles.previewCloseButton} onPress={closePreview}>
            关闭预览
          </Button>
        </View>
      </Modal>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
  },
  helperLabel: {
    marginBottom: 8,
    color: '#555',
  },
  imageCard: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  imagePlaceholderIcon: {
    fontSize: 32,
  },
  imagePlaceholderText: {
    fontWeight: '600',
    color: '#333',
  },
  imagePlaceholderHint: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
  },
  imageMetaBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f7f0',
    gap: 8,
  },
  imageMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageMetaLabel: {
    fontSize: 12,
    color: '#2e7d32',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b2dfdb',
  },
  dotActive: {
    backgroundColor: '#2e7d32',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  addImageItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bdbdbd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    gap: 4,
  },
  addIcon: {
    fontSize: 24,
    color: '#2e7d32',
  },
  addHint: {
    color: '#333',
    fontSize: 12,
  },
  addCount: {
    color: '#888',
    fontSize: 10,
  },
  imageItem: {
    width: '30%',
    alignItems: 'center',
    gap: 4,
  },
  galleryImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#2e7d32',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderRadius: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitButton: {
    marginHorizontal: 16,
    borderRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f6f9f3',
    paddingHorizontal: 24,
  },
  loadingHint: {
    color: '#555',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  previewSlide: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').width * 0.9,
    resizeMode: 'contain',
  },
  previewCloseButton: {
    marginTop: 24,
    borderRadius: 24,
  },
  dialogActionsColumn: {
    gap: 12,
  },
  dialogButton: {
    borderRadius: 24,
  },
});
