// contentGenerate02.js - Meslek ve Dil Bazlı İçerik Üretimi
import { createCanvas, loadImage } from 'canvas'
import readline from 'readline'
import path from 'path'
import fs from 'fs'
//Database bağlantısı
import Database from '../model/database.js'
const db = new Database()

// Canvas ayarları
const WIDTH = 1080
const HEIGHT = 1920

// Kullanıcıdan giriş alma fonksiyonu
function askUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// Meslekleri veritabanından getir ve listele
async function selectProfession() {
  try {
    console.log('\n📋 Meslekler yükleniyor...')

    // Meslekleri veritabanından çek (örnek sorgu - tablonuza göre düzenleyin)
    const professions = await db.query('SELECT * FROM meslek')

    if (professions.length === 0) {
      console.log('⚠️ Veritabanında meslek bulunamadı.')
      return null
    }

    console.log('\n' + '='.repeat(50))
    console.log('👨‍💼 MESLEK SEÇİMİ')
    console.log('='.repeat(50))

    professions.forEach((profession, index) => {
      console.log(`${index + 1}. ${profession.meslek}`)
    })

    console.log('='.repeat(50))

    const choice = await askUser('Meslek seçin (numara girin): ')
    const selectedIndex = parseInt(choice) - 1

    if (selectedIndex >= 0 && selectedIndex < professions.length) {
      const selectedProfession = professions[selectedIndex]
      console.log(`✅ Seçilen meslek: ${selectedProfession.meslek}`)
      console.log(`🔧 Debug - Meslek objesi:`, selectedProfession)
      return selectedProfession
    } else {
      console.log('⚠️ Geçersiz seçim!')
      return null
    }
  } catch (error) {
    console.error('❌ Meslek listesi alınırken hata:', error.message)
    return null
  }
}

// Dilleri veritabanından getir ve listele
async function selectLanguage() {
  try {
    console.log('\n� Diller yükleniyor...')

    // Dilleri veritabanından çek (örnek sorgu - tablonuza göre düzenleyin)
    const languages = await db.query('SELECT * FROM dil')

    if (languages.length === 0) {
      console.log('⚠️ Veritabanında dil bulunamadı.')
      return null
    }

    console.log('\n' + '='.repeat(50))
    console.log('🌐 DİL SEÇİMİ')
    console.log('='.repeat(50))

    languages.forEach((language, index) => {
      console.log(`${index + 1}. ${language.DilAdi}`)
    })

    console.log('='.repeat(50))

    const choice = await askUser('Dil seçin (numara girin): ')
    const selectedIndex = parseInt(choice) - 1

    if (selectedIndex >= 0 && selectedIndex < languages.length) {
      const selectedLanguage = languages[selectedIndex]
      console.log(`✅ Seçilen dil: ${selectedLanguage.DilAdi}`)
      return selectedLanguage
    } else {
      console.log('⚠️ Geçersiz seçim!')
      return null
    }
  } catch (error) {
    console.error('❌ Dil listesi alınırken hata:', error.message)
    return null
  }
}

// Seçilen meslek ve dile göre kelimeleri getir
async function getWordsForProfessionAndLanguage(meslekId, dilId) {
  try {
    console.log(
      `\n🔍 Meslek ID: ${meslekId}, Dil ID: ${dilId} için kelimeler çekiliyor...`
    )

    const words = await db.query(
      `
      SELECT 
        ak.DilID AS AnaDilID, 
        ak.Value, 
        ak.MeslekID, 
        c.HangiDilID, 
        c.Ceviri
      FROM anakelimeler ak
      INNER JOIN ceviriler c ON ak.AnaKelimelerID = c.AnaKelimeID
      WHERE 
        c.HangiDilID = ? 
        AND ak.MeslekID = ? 
        AND ak.test = 1
      GROUP BY ak.Value
      ORDER BY RAND()
      LIMIT 150
    `,
      [dilId, meslekId]
    )

    console.log(`✅ ${words.length} adet kelime çekildi.`)
    return words
  } catch (error) {
    console.error('❌ Kelimeler çekilirken hata:', error.message)
    return []
  }
}

// Yuvarlak resim çizme yardımcı fonksiyonu
function drawCircularImage(ctx, image, x, y, radius) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, x, y, radius * 2, radius * 2)
  ctx.restore()
}

// Metin formatı düzenleme fonksiyonu (sadece ilk harf büyük)
function capitalizeWords(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Görsel oluşturma fonksiyonu
async function createWordCard(word, meslekId, dilId, index) {
  try {
    const canvas = createCanvas(WIDTH, HEIGHT)
    const ctx = canvas.getContext('2d')

    // 1. Meslek arka planı yükle ve çiz
    const jobBgPath = path.join(
      path.resolve(),
      'assets',
      'jobs_image',
      `${meslekId}.png`
    )
    const jobBg = await loadImage(jobBgPath)
    ctx.drawImage(jobBg, 0, 0, WIDTH, HEIGHT)

    // 2. Dil resimlerinin boyutları (yuvarlak için)
    const langImageRadius = 100 // Çap 200px olacak
    const langImageSize = langImageRadius * 2

    // 3. İçerik yerleşimi - üst resmi daha yukarı taşı
    const topImageY = 300 // Üst resmi daha yukarı

    // 4. Üst dil resmi (her zaman 1.png - yuvarlak) - daha yukarıda
    const lang1Path = path.join(
      path.resolve(),
      'assets',
      'languages_image',
      '1.png'
    )
    const lang1Image = await loadImage(lang1Path)

    const lang1X = (WIDTH - langImageSize) / 2
    const lang1Y = topImageY
    drawCircularImage(ctx, lang1Image, lang1X, lang1Y, langImageRadius)

    // 5. Ana kelime (Value) - küçültülmüş, kalın font
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 85px Impact, "Arial Black", sans-serif' // Küçük ve kalın

    const valueText = capitalizeWords(word.Value)
    const valueY = lang1Y + langImageSize + 100 // Biraz daha aşağı

    // Sadece beyaz yazı, border yok
    ctx.fillText(valueText, WIDTH / 2, valueY)

    // 6. Alt dil resmi (seçilen dil - yuvarlak) - tam ortada
    const langSelectedPath = path.join(
      path.resolve(),
      'assets',
      'languages_image',
      `${dilId}.png`
    )
    const langSelectedImage = await loadImage(langSelectedPath)

    // Alt resmi tam ekran ortasına koy
    const lang2X = (WIDTH - langImageSize) / 2
    const lang2Y = HEIGHT / 2 - langImageRadius // Tam ortada
    drawCircularImage(ctx, langSelectedImage, lang2X, lang2Y, langImageRadius)

    // 7. Çeviri yazısı - alt resmin altında, küçültülmüş, kalın
    ctx.font = 'bold 85px Impact, "Arial Black", sans-serif' // Küçük ve kalın
    const cevirText = capitalizeWords(word.Ceviri)
    const cevirY = lang2Y + langImageSize + 100 // Alt resmin altında

    // Sadece beyaz yazı, border yok
    ctx.fillText(cevirText, WIDTH / 2, cevirY)

    // 8. Logo ve "TERM TORCH" yazısı - en altta
    try {
      const logoPath = path.join(path.resolve(), 'assets', 'logodark.png')
      const logoImage = await loadImage(logoPath)

      // Logo boyutu ve pozisyonu (daha büyük, yukarıda konumlandır)
      const logoSize = 180 // 120 → 180 (çok daha büyük)
      const logoX = (WIDTH - logoSize) / 2
      const logoY = HEIGHT - 350 // Alttan 400px yukarıda (daha yukarı taşındı)

      // Logo çiz
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)

      // "TERM TORCH" yazısı logo altında (daha büyük font)
      ctx.font = 'bold 65px Impact, "Arial Black", sans-serif' // 45px → 65px
      ctx.fillStyle = '#FFFFFF'
      const termTorchY = logoY + logoSize + 50 // Logo altında 50px boşluk (daha fazla)
      ctx.fillText('TERM TORCH', WIDTH / 2, termTorchY)
    } catch (error) {
      console.error('⚠️ Logo yüklenemedi:', error.message)
      // Logo yüklenemezse sadece büyük yazıyı göster
      ctx.font = 'bold 65px Impact, "Arial Black", sans-serif' // Büyük font
      ctx.fillStyle = '#FFFFFF'
      const termTorchY = HEIGHT - 200 // Alttan 250px yukarıda (yukarı taşındı)
      ctx.fillText('TERM TORCH', WIDTH / 2, termTorchY)
    }

    // 9. Dosyayı kaydet
    const outputDir = path.join('output', 'contentGenerate02')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filename = `word_${index + 1}_${word.Value.replace(
      /[^a-z0-9]/gi,
      '_'
    )}.png`
    const outputPath = path.join(outputDir, filename)

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(outputPath, buffer)

    console.log(`✅ Görsel kaydedildi: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`❌ ${word.Value} için görsel oluşturulamadı:`, error.message)
    return null
  }
}

// --- Content Generate 02: Meslek ve Dil Bazlı İçerik Üretimi ---
export async function runContentGenerate02() {
  console.log('🎯 Content Generate 02: Meslek ve Dil Bazlı İçerik Üretimi')
  console.log(
    '📝 Bu bölümde meslek ve dil seçimi yapıp kelime kartları oluşturacaksınız\n'
  )

  try {
    // 1. Meslek seç
    const selectedProfession = await selectProfession()
    if (!selectedProfession) {
      console.log('❌ Meslek seçimi yapılamadı. İşlem iptal edildi.')
      return
    }

    // 2. Dil seç
    const selectedLanguage = await selectLanguage()
    if (!selectedLanguage) {
      console.log('❌ Dil seçimi yapılamadı. İşlem iptal edildi.')
      return
    }

    // 3. ID'leri al (daha kapsamlı kontrol)
    const meslekId = selectedProfession.idMeslek
    const dilId =
      selectedLanguage.DilID ||
      console.log(
        `\n🔧 Debug - Meslek objesi tüm alanları:`,
        Object.keys(selectedProfession)
      )
    console.log(
      `🔧 Debug - Dil objesi tüm alanları:`,
      Object.keys(selectedLanguage)
    )
    console.log(`\n🔧 Seçilen Meslek ID: ${meslekId}`)
    console.log(`🔧 Seçilen Dil ID: ${dilId}`)

    if (!meslekId) {
      console.log(
        '❌ Meslek ID bulunamadı! Lütfen veritabanı sütun adlarını kontrol edin.'
      )
      return
    }

    if (!dilId) {
      console.log(
        '❌ Dil ID bulunamadı! Lütfen veritabanı sütun adlarını kontrol edin.'
      )
      return
    }

    // 4. Kelimeleri çek
    const words = await getWordsForProfessionAndLanguage(meslekId, dilId)

    if (words.length === 0) {
      console.log('⚠️ Bu meslek ve dil kombinasyonu için kelime bulunamadı.')
      return
    }

    // 5. Her kelime için görsel oluştur
    console.log(`\n🎨 ${words.length} adet görsel oluşturuluyor...`)

    let successCount = 0
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      console.log(
        `\n🔄 ${i + 1}/${words.length} - "${word.Value}" işleniyor...`
      )

      const result = await createWordCard(word, meslekId, dilId, i)
      if (result) {
        successCount++
      }
    }

    // 6. Özet göster
    console.log('\n' + '🎉'.repeat(50))
    console.log('✅ İŞLEM TAMAMLANDI!')
    console.log('🎉'.repeat(50))
    console.log(`👨‍💼 Meslek: ${selectedProfession.meslek}`)
    console.log(`🌐 Dil: ${selectedLanguage.DilAdi}`)
    console.log(`📊 Toplam işlenen kelime: ${words.length}`)
    console.log(`✅ Başarılı görsel: ${successCount}`)
    console.log(`� Klasör: output/contentGenerate02`)
    console.log('🎉'.repeat(50))
  } catch (error) {
    console.error('❌ Content Generate 02 hatası:', error.message)
  }
}
