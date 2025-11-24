// index.js - Ana Menü Sistemi
import readline from 'readline' // Kullanıcı girişi için readline modülü
import { runContentGenerate01 } from './generate/contentGenerate01.js'
import { runContentGenerate02 } from './generate/contentGenerate02.js'

// --- Ana Menü Sistemi ---

// Ana menüyü göster
function showMainMenu() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 TİKTOK İÇERİK ÜRETİCİ - ANA MENÜ')
  console.log('='.repeat(60))
  console.log('1️⃣  - Content Generate 01 (Temel Kelime Kartları)')
  console.log('2️⃣  - Content Generate 02 (Meslek ve Dil Bazlı)')
  console.log('❌ q - Çıkış')
  console.log('='.repeat(60))
}

// Kullanıcıdan giriş alma fonksiyonu
function askUserChoice() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('Seçiminizi yapın (1, 2 veya q): ', (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// Devam etmek isteyip istemediğini sor
function askContinue() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log('\n' + '-'.repeat(50))
    console.log('🔄 Başka bir işlem yapmak istiyor musunuz?')
    console.log('✅ y - Ana menüye dön')
    console.log('❌ q - Çıkış')
    console.log('-'.repeat(50))

    rl.question('Seçiminizi yapın (y veya q): ', (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// Ana program döngüsü
async function mainProgram() {
  console.log('🌟 TikTok İçerik Üretici Sistemi Başlatılıyor...\n')

  while (true) {
    try {
      showMainMenu()
      const userChoice = await askUserChoice()

      if (userChoice === '1') {
        console.log('\n🎯 Content Generate 01 başlatılıyor...\n')
        await runContentGenerate01()

        // İşlem tamamlandıktan sonra devam etmek isteyip istemediğini sor
        const continueChoice = await askContinue()
        if (continueChoice === 'q') {
          console.log('\n� Program sonlandırılıyor. Görüşmek üzere!')
          process.exit(0)
        }
        // 'y' ise döngü devam edecek
      } else if (userChoice === '2') {
        console.log('\n🎯 Content Generate 02 başlatılıyor...\n')
        await runContentGenerate02()

        // İşlem tamamlandıktan sonra devam etmek isteyip istemediğini sor
        const continueChoice = await askContinue()
        if (continueChoice === 'q') {
          console.log('\n👋 Program sonlandırılıyor. Görüşmek üzere!')
          process.exit(0)
        }
        // 'y' ise döngü devam edecek
      } else if (userChoice === 'q') {
        console.log('\n👋 Program sonlandırılıyor. Görüşmek üzere!')
        process.exit(0)
      } else {
        console.log('\n⚠️  Geçersiz seçim! Lütfen 1, 2 veya q yazın.')
        continue // Tekrar sor
      }
    } catch (error) {
      console.error('\n❌ Bir hata oluştu:', error.message)

      const continueChoice = await askContinue()
      if (continueChoice === 'q') {
        console.log('\n👋 Program sonlandırılıyor.')
        process.exit(0)
      }
    }
  }
}

// Program başlatma
mainProgram().catch((error) => {
  console.error('❌ Program hatası:', error.message)
  process.exit(1)
})
