import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useWeightUnit } from '@/hooks/useWeightUnit';

export default function Settings() {
  const { unit, setUnit } = useWeightUnit();

  return (
    <div className="min-h-screen pb-20">
      <Header title="Settings" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card-intense p-4">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Preferences</h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="weight-unit" className="text-base">Weight Unit</Label>
                <p className="text-sm text-muted-foreground">
                  {unit === 'kg' ? 'Using kilograms (kg)' : 'Using pounds (lbs)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={unit === 'kg' ? 'text-primary font-medium' : 'text-muted-foreground'}>kg</span>
                <Switch
                  id="weight-unit"
                  checked={unit === 'lbs'}
                  onCheckedChange={(checked) => setUnit(checked ? 'lbs' : 'kg')}
                />
                <span className={unit === 'lbs' ? 'text-primary font-medium' : 'text-muted-foreground'}>lbs</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
