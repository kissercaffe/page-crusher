import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import UrlInput from './UrlInput';

const meta = {
  title: 'Components/UrlInput',
  component: UrlInput,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // Use `fn` to spy on the callbacks, which will appear in the actions panel once invoked
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof UrlInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallbacks: Story = {
  args: {
    onSubmit: fn((url: string) => {
      console.log('URL submitted:', url);
    }),
    onCancel: fn(() => {
      console.log('Cancelled');
    }),
  },
};

export const Interactive: Story = {
  args: {
    onSubmit: fn((url: string) => {
      alert(`URL submitted: ${url}`);
    }),
    onCancel: fn(() => {
      alert('Cancelled');
    }),
  },
};
