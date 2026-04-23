import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const LineChart = lazy(() => import('react-native-gifted-charts').then(module => ({ default: module.LineChart })));
const BarChart = lazy(() => import('react-native-gifted-charts').then(module => ({ default: module.BarChart })));
const PieChart = lazy(() => import('react-native-gifted-charts').then(module => ({ default: module.PieChart })));

export const LazyLineChart = (props: any) => (
  <Suspense fallback={<View style={{ height: 200, justifyContent: 'center' }}><ActivityIndicator /></View>}>
    <LineChart {...props} />
  </Suspense>
);

export const LazyBarChart = (props: any) => (
  <Suspense fallback={<View style={{ height: 200, justifyContent: 'center' }}><ActivityIndicator /></View>}>
    <BarChart {...props} />
  </Suspense>
);

export const LazyPieChart = (props: any) => (
  <Suspense fallback={<View style={{ height: 200, justifyContent: 'center' }}><ActivityIndicator /></View>}>
    <PieChart {...props} />
  </Suspense>
);
