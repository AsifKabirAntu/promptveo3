-- Create a function to count prompts by category
CREATE OR REPLACE FUNCTION public.get_prompts_by_category()
RETURNS TABLE (category text, count bigint)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    category, 
    COUNT(*) AS count
  FROM 
    public.prompts
  GROUP BY 
    category
  ORDER BY 
    count DESC;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_prompts_by_category() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_prompts_by_category() TO anon;
GRANT EXECUTE ON FUNCTION public.get_prompts_by_category() TO service_role; 