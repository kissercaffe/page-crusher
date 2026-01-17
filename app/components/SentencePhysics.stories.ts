import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import SentencePhysics from './SentencePhysics';

const meta = {
  title: 'Components/SentencePhysics',
  component: SentencePhysics,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'padded',
  },
} satisfies Meta<typeof SentencePhysics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sentences: [
      'Hello, World!',
      'This is a test sentence.',
      'Storybook is great!',
    ],
  },
};

export const SingleSentence: Story = {
  args: {
    sentences: ['A single sentence falls down.'],
  },
};

export const MultipleSentences: Story = {
  args: {
    sentences: [
      'First sentence',
      'Second sentence',
      'Third sentence',
      'Fourth sentence',
      'Fifth sentence',
      'Sixth sentence',
    ],
  },
};

export const LongSentences: Story = {
  args: {
    sentences: [
      'This is a very long sentence that will test how the component handles longer text content.',
      'Another long sentence to demonstrate the physics simulation with extended text.',
      'The quick brown fox jumps over the lazy dog. This sentence contains all letters of the alphabet.',
    ],
  },
};

export const ShortSentences: Story = {
  args: {
    sentences: ['Hi', 'Yo', 'Hey', 'OK', 'Yes', 'No'],
  },
};

export const JapaneseSentences: Story = {
  args: {
    sentences: [
      'こんにちは、世界！',
      'これはテスト文です。',
      'Storybookは素晴らしいです！',
      '物理エンジンを使ったコンポーネントです。',
    ],
  },
};

export const MixedLanguages: Story = {
  args: {
    sentences: [
      'Hello, 世界！',
      'こんにちは World!',
      'Test テスト',
      'Mixed 混合 languages 言語',
    ],
  },
};
