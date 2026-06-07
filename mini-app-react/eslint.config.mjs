import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const root = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: root
});

const config = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**']
  },
  ...compat.extends('next/core-web-vitals')
];

export default config;
