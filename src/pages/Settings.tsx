import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Lock, Eye, EyeOff, Shield, Music, User, Mail, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { useWorkoutMusic } from '@/hooks/useWorkoutMusic';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { unit, setUnit } = useWeightUnit();
  const { musicEnabled, setMusicEnabled } = useWorkoutMusic();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Check admin status
      const { data: adminData } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      setIsAdmin(!!adminData);
      
      // Fetch profile with username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        setUsername(profile.username);
      }
      
      // Set email from auth user (filter out generated emails)
      const userEmail = user.email || '';
      if (!userEmail.endsWith('@muscleforge.local')) {
        setEmail(userEmail);
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleEmailUpdate = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    
    const { error } = await supabase.auth.updateUser({
      email: email,
    });

    setIsUpdatingEmail(false);

    if (error) {
      toast({
        title: "Error updating email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email updated",
        description: "Your email has been changed successfully.",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setIsUpdating(false);
      toast({
        title: "Incorrect current password",
        description: "Please check your current password and try again.",
        variant: "destructive",
      });
      return;
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsUpdating(false);

    if (error) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Settings" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {isAdmin && (
            <div className="card-intense p-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Admin</h2>
              </div>

              <Button 
                variant="fire" 
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Open Admin Panel
              </Button>
            </div>
          )}

          {user && (
            <div className="card-intense p-4">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Account</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <AtSign className="w-4 h-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleEmailUpdate}
                      disabled={isUpdatingEmail}
                      size="sm"
                    >
                      {isUpdatingEmail ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card-intense p-4">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Preferences</h2>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
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

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label htmlFor="workout-music" className="text-base flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Workout Music
                </Label>
                <p className="text-sm text-muted-foreground">
                  {musicEnabled ? 'Music will play during workouts' : 'Music is disabled'}
                </p>
              </div>
              <Switch
                id="workout-music"
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
              />
            </div>
          </div>

          {user && (
            <div className="card-intense p-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Change Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
