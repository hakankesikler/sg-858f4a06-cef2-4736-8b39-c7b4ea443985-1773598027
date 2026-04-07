-- ADIM 1: Mevcut tüm kullanıcıları onayla
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ADIM 2: Otomatik onaylama trigger'ı oluştur
-- Yeni kullanıcılar oluşturulduğunda otomatik olarak onaylansın

-- Önce eski trigger varsa sil
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_user();

-- Trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eğer e-posta onaylanmamışsa, otomatik onayla
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();

-- Kontrol için mevcut onaylanmamış kullanıcı sayısını göster
SELECT 
  COUNT(*) as toplam_kullanici,
  SUM(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as onaylanmis_kullanici,
  SUM(CASE WHEN email_confirmed_at IS NULL THEN 1 ELSE 0 END) as onaylanmamis_kullanici
FROM auth.users;