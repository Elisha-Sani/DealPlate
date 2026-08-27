-- Create a function to update student profile stats when an order is completed
CREATE OR REPLACE FUNCTION update_student_stats_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_deal public.deals%ROWTYPE;
    v_saved numeric(10,2);
BEGIN
    -- Only act if the status changed to 'Completed'
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        -- Calculate how much they saved
        -- deal_original_price - deal_price
        v_saved := COALESCE(NEW.deal_original_price, 0) - COALESCE(NEW.deal_price, 0);
        IF v_saved < 0 THEN
            v_saved := 0;
        END IF;

        -- Update the student profile
        UPDATE public.student_profiles
        SET 
            meals_enjoyed = meals_enjoyed + 1,
            total_saved = total_saved + v_saved
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS trigger_update_student_stats ON public.orders;

CREATE TRIGGER trigger_update_student_stats
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_student_stats_on_order_complete();
