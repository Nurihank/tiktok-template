// index.js (Dosyanızın Başlangıcı)
import { createCanvas, loadImage } from 'canvas'
import path from 'path' // path'i sadece path olarak import ediyoruz
import fs from 'fs' // Dosya işlemleri için fs import edildi
import readline from 'readline' // Kullanıcı girişi için readline modülü
//Database bağlantısı
import Database from './model/database.js'
const db = new Database()

// --- Sabit Ayarlar ---
const WIDTH = 1080
const HEIGHT = 1920
const GRADIENT_COLORS = ['#693D89', '#5A227E', '#4A1769', '#3C0663', '#2A0040']
const WORD_BACKGROUND_COLOR = '#2c0048' // Ortadaki kelimenin arka plan rengi
const Y_OFFSET = -100 // Tüm içeriği bu miktar kadar yukarı kaydırır

// Canvas oluşturma
const canvas = createCanvas(WIDTH, HEIGHT)
const ctx = canvas.getContext('2d')
// -----------------------

// FONKSİYON, ÜST METİNİ VE ORTADAKİ KELİMEYİ DİREKT PARAMETRE OLARAK ALACAK ŞEKİLDE GÜNCELLENDİ
async function createTemplateImage(
  topText,
  wordInBox,
  filenameSuffix,
  folderName = 'output'
) {
  // 1. Arka Planı Dikey Renk Geçişi (Gradient)
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)

  GRADIENT_COLORS.forEach((color, index) => {
    const stop = index / (GRADIENT_COLORS.length - 1)
    gradient.addColorStop(stop, color)
  })

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT) // 2. Üstteki Sabit/Değişken Metin

  const topTextYStart = 500 + Y_OFFSET

  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'

  const lines = topText.split('\n')
  lines.forEach((line, index) => {
    // Dinamik metin boyutlandırma
    if (lines.length > 3 && index === 0) {
      ctx.font = 'bold 95px sans-serif' // İngilizce kelime
    } else if (index === 1) {
      ctx.font = 'bold 90px sans-serif'
    } else {
      ctx.font = 'bold 80px sans-serif'
    }
    ctx.fillText(line, WIDTH / 2, topTextYStart + index * 100)
  }) // 3. Ortadaki Değişken Kelime ve Arka Plan Kutusu

  const wordYCenter = 1050 + Y_OFFSET // --- SABİT KUTU BOYUTLARI ---

  const FIXED_BOX_WIDTH = 880
  const FIXED_BOX_HEIGHT = 320 // ----------------------------
  let fontSize = 70
  ctx.font = `bold ${fontSize}px sans-serif`
  let textMetrics = ctx.measureText(wordInBox) // Kelimenin font boyutunu, sabit kutunun içine sığacak şekilde dinamik olarak ayarla

  while (textMetrics.width > FIXED_BOX_WIDTH - 150 && fontSize > 40) {
    fontSize -= 5
    ctx.font = `bold ${fontSize}px sans-serif`
    textMetrics = ctx.measureText(wordInBox)
  } // Sabit kutu boyutlarını kullanma

  const wordBoxWidth = FIXED_BOX_WIDTH
  const wordBoxHeight = FIXED_BOX_HEIGHT

  const borderRadius = 40 // Kutuyu ortalamak için X ve Y pozisyonları

  const wordBoxX = (WIDTH - wordBoxWidth) / 2
  const wordBoxY = wordYCenter - wordBoxHeight / 2 - 40

  ctx.fillStyle = WORD_BACKGROUND_COLOR // Köşeleri yuvarlatılmış dikdörtgen çizme fonksiyonu

  roundRect(ctx, wordBoxX, wordBoxY, wordBoxWidth, wordBoxHeight, borderRadius)
  ctx.fill() // Arka plan rengiyle doldur

  ctx.fillStyle = 'white' // Ortadaki kelimeyi yazdır
  ctx.fillText(wordInBox, WIDTH / 2, wordYCenter + fontSize / 3 - 25) // 4. Logo ve Alt Metin

  const logoPath = path.join(path.resolve(), 'assets', 'logodark.png')

  try {
    const logoImage = await loadImage(logoPath)
    const logoSize = 150
    const logoY = 1500 + Y_OFFSET

    ctx.drawImage(
      logoImage,
      WIDTH / 2 - logoSize / 2,
      logoY,
      logoSize,
      logoSize
    )

    ctx.font = 'bold 80px sans-serif'
    ctx.fillStyle = 'white'
    ctx.fillText('TERM TORCH', WIDTH / 2, logoY + logoSize + 100)
  } catch (error) {
    console.error(`⚠️ Logo yüklenemedi: ${logoPath}. Hata:`, error.message)
    ctx.font = 'bold 80px sans-serif'
    ctx.fillStyle = 'white'
    ctx.fillText('TERM TORCH', WIDTH / 2, 1650 + Y_OFFSET)
  } // 5. Kaydetme (Suffix kullanılarak benzersiz dosya adı oluşturuldu)

  const filename = `${filenameSuffix.replace(/[^a-z0-9]/gi, '_')}.png`
  const buffer = canvas.toBuffer('image/png')
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true })
  }
  const outputPath = path.join(folderName, filename)
  fs.writeFileSync(outputPath, buffer)
  console.log(`✅ Görsel başarıyla kaydedildi: ${outputPath}`)
}

// Köşeleri yuvarlatılmış dikdörtgen çizmek için yardımcı fonksiyon
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

// Çalışma sayacını okuma ve güncelleme fonksiyonu
function getNextRunNumber() {
  const counterFile = 'run_counter.txt'
  let runNumber = 1

  if (fs.existsSync(counterFile)) {
    const content = fs.readFileSync(counterFile, 'utf8').trim()
    runNumber = parseInt(content) || 1
  }

  // Bir sonraki çalışma için sayacı artır ve kaydet
  fs.writeFileSync(counterFile, (runNumber + 1).toString())

  return runNumber
}

// Kullanıcıdan giriş alma fonksiyonu
function askUserChoice() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log('\n' + '='.repeat(50))
    console.log('🎯 Ne yapmak istiyorsunuz?')
    console.log('1️⃣  - Tekrar görsel üret')
    console.log('❌ q - Çıkış')
    console.log('='.repeat(50))

    rl.question('Seçiminizi yapın (1 veya q): ', (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// Ana program döngüsü
async function mainProgram() {
  console.log('🚀 TikTok Görsel Üretici Başlatılıyor...\n')

  while (true) {
    try {
      await runGenerator()

      // Kullanıcıya seçenek sun
      const userChoice = await askUserChoice()

      if (userChoice === '1') {
        console.log('\n🔄 Yeni görsel seti oluşturuluyor...\n')
        continue // Döngüyü devam ettir
      } else if (userChoice === 'q') {
        console.log('\n👋 Program sonlandırılıyor. Görüşmek üzere!')
        process.exit(0)
      } else {
        console.log('\n⚠️  Geçersiz seçim! Lütfen 1 veya q yazın.')
        continue // Tekrar sor
      }
    } catch (error) {
      console.error('\n❌ Bir hata oluştu:', error.message)

      const userChoice = await askUserChoice()
      if (userChoice === 'q') {
        console.log('\n👋 Program sonlandırılıyor.')
        process.exit(0)
      }
    }
  }
}

// --- Test Çalıştırma Bloğu (Artık iki kart tipi üretiyor) ---
async function runGenerator() {
  // Çalışma numarasını al
  const runNumber = getNextRunNumber()
  const mainOutputFolder = runNumber.toString()

  console.log(
    `📁 Çalışma #${runNumber} - Tüm resimler '${mainOutputFolder}' klasörüne kaydedilecek`
  )
  console.log('⏳ Veritabanından kelimeler çekiliyor...')

  const termList = await db.query(
    'SELECT tk.value, tkc.Ceviri FROM temelkelimeler tk INNER JOIN temelkelimelerceviri tkc ON tk.id = tkc.KelimeID WHERE tkc.AnaDilID = 1 AND tkc.HangiDilID = 2 ORDER BY RAND() LIMIT 15'
  )

  if (termList.length === 0) {
    console.log('⚠️ Veritabanından kelime dönmedi. Sorgunuzu kontrol edin.')
    return
  }

  console.log(
    `✅ ${termList.length} adet rastgele kelime çekildi. Görsel oluşturma başlatılıyor...`
  )

  for (let i = 0; i < termList.length; i++) {
    const word = termList[i]

    // -----------------------
    // 1. SORU KARTI (QUESTION CARD) - (İngilizce kelimeyi ortada soruyor)
    // -----------------------
    console.log(
      `\n🔄 "${word.value}" Soru Kartı oluşturuluyor... (Klasör: ${mainOutputFolder})`
    ) // Üst Metin: Sizin orijinal sabit metniniz
    const questionTopText = 'BU KELİMENİN\nTÜRKÇESİNİ\nBİLİYOR MUSUN ?' // Orta Kutu İçeriği: İngilizce kelime (value)
    await createTemplateImage(
      questionTopText,
      word.value,
      `${word.value}_Q`,
      mainOutputFolder
    ) // ----------------------- // 2. CEVAP KARTI (ANSWER CARD) - (Türkçe çeviriyi ortada gösteriyor) // -----------------------

    console.log(
      `🔄 "${word.value}" Cevap Kartı oluşturuluyor... (Klasör: ${mainOutputFolder})`
    ) // BURASI GÜNCELLENDİ: Sadece statik başlık
    const answerTopText = 'TÜRKÇE\nANLAMI' // Orta Kutu İçeriği: Türkçe çeviri (Ceviri)
    await createTemplateImage(
      answerTopText,
      word.Ceviri,
      `${word.value}_A`,
      mainOutputFolder
    )
  }

  console.log(
    `\n🌟 Tüm görsellerin oluşturma işlemi tamamlandı. Klasör: ${mainOutputFolder}`
  )
  console.log(`📊 Toplam ${termList.length * 2} adet görsel oluşturuldu.`)
}

// Program başlatma
mainProgram().catch((error) => {
  console.error('❌ Program hatası:', error.message)
  process.exit(1)
})
