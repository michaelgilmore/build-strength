-- Allow admins to view all workout logs
CREATE POLICY "Admins can view all workout logs"
ON public.workout_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all workout logs
CREATE POLICY "Admins can update all workout logs"
ON public.workout_logs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete all workout logs
CREATE POLICY "Admins can delete all workout logs"
ON public.workout_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));