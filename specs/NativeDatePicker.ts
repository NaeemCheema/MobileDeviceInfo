import { TurboModule, TurboModuleRegistry } from 'react-native';

export type DatePickerMode = 'date' | 'time' | 'datetime';
type DatePickerDisplay = 'default' | 'spinner' | 'calendar' | 'clock';

interface DatePickerOptions {
  mode: DatePickerMode;
  display?: DatePickerDisplay;
  value?: number;
  minimumDate?: number;
  maximumDate?: number;
}

interface DatePickerResult {
  value: number;
  cancelled: boolean;
}

export interface Spec extends TurboModule {
  open: (options: DatePickerOptions) => Promise<DatePickerResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DatePicker');
