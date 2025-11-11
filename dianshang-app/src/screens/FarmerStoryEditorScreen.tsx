import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';

import { useAuthStore } from '../store/authStore';
import {
  createFarmerStoryEntry,
  fetchFarmerStory,
  updateFarmerStory,
} from '../services/farmer.api';
import type {
  CreateFarmerStoryEntryPayload,
  FarmerStoryEntry,
  UpdateFarmerStoryPayload,
} from '../types/farmer';

type StoryFormValues = {
  heroImage?: string;
  region?: string;
  storyHeadline?: string;
  storyContent?: string;
  storyHighlightsText?: string;
  galleryText?: string;
  certificationsText?: string;
};

export default function FarmerStoryEditorScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const farmerId = user?.farmerProfileId;
  const storyEditKey = ['farmer-story-edit', farmerId ?? ''] as const;
  const storyViewKey = ['farmer-story', farmerId ?? ''] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey: storyEditKey,
    queryFn: () => fetchFarmerStory(farmerId ?? ''),
    enabled: Boolean(farmerId),
  });

  const { control, handleSubmit, reset } = useForm<StoryFormValues>({
    defaultValues: {},
  });

  useEffect(() => {
    if (data?.overview) {
      reset({
        heroImage: data.overview.heroImage ?? undefined,
        region: data.overview.region ?? undefined,
        storyHeadline: data.overview.storyHeadline ?? undefined,
        storyContent: data.overview.storyContent ?? undefined,
        storyHighlightsText: data.overview.storyHighlights?.join('\n') ?? undefined,
        galleryText: data.overview.storyGallery
          ?.map((item) => `${item.url}${item.caption ? `|${item.caption}` : ''}`)
          .join('\n'),
        certificationsText: data.overview.certifications
          ?.map((item) => `${item.title}${item.issuer ? `|${item.issuer}` : ''}${item.issuedAt ? `|${item.issuedAt}` : ''}`)
          .join('\n'),
      });
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateFarmerStoryPayload) => updateFarmerStory(farmerId ?? '', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyEditKey });
      queryClient.invalidateQueries({ queryKey: storyViewKey });
      Alert.alert('保存成功', '农户故事已更新。');
    },
    onError: (error: any) => {
      Alert.alert('保存失败', error?.response?.data?.message ?? '请稍后再试');
    },
  });

  const entryMutation = useMutation({
    mutationFn: (payload: CreateFarmerStoryEntryPayload) =>
      createFarmerStoryEntry(farmerId ?? '', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyEditKey });
      queryClient.invalidateQueries({ queryKey: storyViewKey });
      Alert.alert('已发布', '故事节点已添加至时间轴。');
    },
    onError: (error: any) => {
      Alert.alert('提交失败', error?.response?.data?.message ?? '请稍后再试');
    },
  });

  const onSubmit = (values: StoryFormValues) => {
    const payload: UpdateFarmerStoryPayload = {};

    if (values.heroImage !== undefined) payload.heroImage = values.heroImage;
    if (values.region !== undefined) payload.region = values.region;
    if (values.storyHeadline !== undefined) payload.storyHeadline = values.storyHeadline;
    if (values.storyContent !== undefined) payload.storyContent = values.storyContent;
    if (values.storyHighlightsText !== undefined) {
      payload.storyHighlights = values.storyHighlightsText
        ?.split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (values.galleryText !== undefined) {
      payload.storyGallery = values.galleryText
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [url, caption] = line.split('|');
          return { type: 'image' as const, url, caption };
        });
    }
    if (values.certificationsText !== undefined) {
      payload.certifications = values.certificationsText
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, issuer, issuedAt] = line.split('|');
          return { title, issuer, issuedAt };
        });
    }

    updateMutation.mutate(payload);
  };

  const onCreateStory = (values: { title: string; content: string; labels?: string }) => {
    const payload: CreateFarmerStoryEntryPayload = {
      title: values.title,
      content: values.content,
    };
    if (values.labels) {
      payload.labels = values.labels.split(/[，,]/).map((item) => item.trim()).filter(Boolean);
    }
    entryMutation.mutate(payload);
  };

  if (!farmerId) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>当前账号未关联农户档案，无法维护故事。</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator />
        <Text style={styles.hintText}>加载农户故事中...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>暂时无法获取农户故事，请稍后再试。</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>溯源档案</Text>
      <Controller
        control={control}
        name="heroImage"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="封面图 URL"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            placeholder="https://..."
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange } }) => (
          <TextInput label="产区" value={value} onChangeText={onChange} style={styles.input} mode="outlined" />
        )}
      />
      <Controller
        control={control}
        name="storyHeadline"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="故事标题"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
          />
        )}
      />
      <Controller
        control={control}
        name="storyContent"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="故事正文"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        )}
      />
      <Controller
        control={control}
        name="storyHighlightsText"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="亮点（每行一个）"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="下单 12 小时内采摘\n冷链控温 5℃"
          />
        )}
      />
      <Controller
        control={control}
        name="galleryText"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="图片（格式：url|可选说明，每行一条）"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        )}
      />
      <Controller
        control={control}
        name="certificationsText"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="认证（格式：名称|机构|日期，每行一条）"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Button
        mode="contained"
        style={styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        loading={updateMutation.isPending}
      >
        保存档案
      </Button>

      <Divider style={styles.divider} />

      <Text style={styles.sectionTitle}>新增故事节点</Text>
      <StoryEntryForm
        loading={entryMutation.isPending}
        onSubmit={(values) => onCreateStory(values)}
      />

      <Divider style={styles.divider} />

      <Text style={styles.sectionTitle}>历史节点</Text>
      {data?.stories.length ? (
        data.stories.map((item: FarmerStoryEntry) => (
          <View key={item.id} style={styles.storyItem}>
            <Text style={styles.storyItemTitle}>{item.title}</Text>
            <Text style={styles.storyItemTime}>{new Date(item.publishedAt).toLocaleString()}</Text>
            <Text style={styles.storyItemContent}>{item.content}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.hintText}>还没有故事节点，快来记录第一篇吧。</Text>
      )}
    </ScrollView>
  );
}

type StoryEntryFormProps = {
  loading: boolean;
  onSubmit: (values: { title: string; content: string; labels?: string }) => void;
};

function StoryEntryForm({ loading, onSubmit }: StoryEntryFormProps) {
  const { control, handleSubmit, reset } = useForm<{ title: string; content: string; labels?: string }>({
    defaultValues: { title: '', content: '', labels: '' },
  });

  const handle = handleSubmit((values) => {
    onSubmit(values);
    reset({ title: '', content: '', labels: '' });
  });

  return (
    <View style={styles.entryFormBox}>
      <Controller
        control={control}
        name="title"
        rules={{ required: '请输入标题' }}
        render={({ field: { value, onChange }, fieldState }) => (
          <TextInput
            label="标题"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            error={Boolean(fieldState.error)}
          />
        )}
      />
      <Controller
        control={control}
        name="content"
        rules={{ required: '请输入内容' }}
        render={({ field: { value, onChange }, fieldState }) => (
          <TextInput
            label="内容"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            error={Boolean(fieldState.error)}
          />
        )}
      />
      <Controller
        control={control}
        name="labels"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="标签（使用逗号分隔）"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            mode="outlined"
          />
        )}
      />
      <Button mode="outlined" onPress={handle} loading={loading} disabled={loading}>
        发布故事节点
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e5436',
  },
  input: {
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 10,
  },
  divider: {
    marginVertical: 16,
  },
  storyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dce0d9',
  },
  storyItemTitle: {
    fontWeight: '600',
    color: '#2f3d2b',
  },
  storyItemTime: {
    marginTop: 4,
    color: '#90a4ae',
    fontSize: 12,
  },
  storyItemContent: {
    marginTop: 8,
    color: '#455a64',
    lineHeight: 20,
  },
  entryFormBox: {
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9f6',
  },
  hintText: {
    marginTop: 12,
    color: '#607d8b',
  },
  errorText: {
    color: '#d32f2f',
  },
});
