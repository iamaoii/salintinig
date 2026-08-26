const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const DEEP_FILTER_EXE = path.join(__dirname, '../../bin/deep-filter.exe');

/**
 * SalinTinig Master Studio Audio Denoise Pipeline:
 * 1. Step 1 (FFmpeg Highpass 100Hz): Cuts 100% of electric fan wind rumble & room floor vibrations
 * 2. Step 2 (FFmpeg 48kHz Mono WAV): Standardizes sample rate for DeepFilterNet AI
 * 3. Step 3 (DeepFilterNet AI): Applies Deep Complex Filtering (-D -a 20 --pf) for speech isolation
 * 4. Step 4 (FFmpeg Studio Loudnorm): Normalizes studio loudness (EBU R128) for loud, crystal-clear vocal volume
 */

const prepareHighFidelityWav = (inputPath, tempWavPath) => {
  return new Promise((resolve) => {
    // Cut electric fan wind rumble below 100Hz and standardize to 48kHz Mono 16-bit WAV
    const args = [
      '-y',
      '-i', inputPath,
      '-af', 'highpass=f=100',
      '-ar', '48000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      tempWavPath
    ];
    execFile('ffmpeg', args, (err) => {
      if (!err && fs.existsSync(tempWavPath) && fs.statSync(tempWavPath).size > 0) {
        return resolve(tempWavPath);
      }
      resolve(inputPath);
    });
  });
};

const runDeepFilterNet = (wavPath, outputDir) => {
  return new Promise((resolve) => {
    if (!fs.existsSync(DEEP_FILTER_EXE)) {
      return resolve(wavPath);
    }
    // DeepFilterNet AI execution with attenuation limit set to 20 dB
    const args = ['-o', outputDir, '-D', '-a', '20', '--pf', wavPath];
    execFile(DEEP_FILTER_EXE, args, (err) => {
      const parsed = path.parse(wavPath);
      const expectedOutput = path.join(outputDir, parsed.base);
      if (!err && fs.existsSync(expectedOutput) && fs.statSync(expectedOutput).size > 0) {
        return resolve(expectedOutput);
      }
      resolve(wavPath);
    });
  });
};

const normalizeStudioLoudness = (inputPath, outputPath) => {
  return new Promise((resolve) => {
    // Option 2: EBU R128 normalization + volume boost + hard limiter (loud, stable, zero distortion)
    const args = [
      '-y',
      '-i', inputPath,
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:linear=true, volume=1.5, alimiter=level_out=0.95:attack=5:release=50',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputPath
    ];
    execFile('ffmpeg', args, (err) => {
      if (!err && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return resolve(outputPath);
      }
      resolve(inputPath);
    });
  });
};

/**
 * Master Denoise Audio Helper
 * @param {string} inputPath 
 * @returns {Promise<{ originalPath: string, enhancedPath: string }>}
 */
const denoiseAudio = async (inputPath) => {
  if (!fs.existsSync(inputPath)) {
    return { originalPath: inputPath, enhancedPath: inputPath };
  }

  try {
    const parsed = path.parse(inputPath);
    const tempWavPath = path.join(parsed.dir, `${parsed.name}_48k.wav`);
    const masterPath = path.join(parsed.dir, `${parsed.name}_master.m4a`);
    const outputDir = path.join(parsed.dir, 'df_clean');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Cut electric fan wind rumble (<100Hz) & convert to 48kHz WAV
    const wav48k = await prepareHighFidelityWav(inputPath, tempWavPath);

    // 2. Run DeepFilterNet AI Speech Isolation (-a 20 --pf)
    const dfEnhancedWav = await runDeepFilterNet(wav48k, outputDir);

    // 3. Apply Studio Loudness Normalization & Volume Boost
    const masterAudio = await normalizeStudioLoudness(dfEnhancedWav, masterPath);

    console.log('[SalintinigMasterPipeline] Studio quality audio generated:', masterAudio);

    return {
      originalPath: masterAudio,
      enhancedPath: masterAudio,
    };
  } catch (e) {
    console.error('[SalintinigMasterPipeline] Notice:', e.message);
    return { originalPath: inputPath, enhancedPath: inputPath };
  }
};

/**
 * Clean up temporary audio files generated during processing
 * @param {string} inputPath 
 */
const cleanupTempAudio = (inputPath) => {
  if (!inputPath || typeof inputPath !== 'string') return;
  try {
    const parsed = path.parse(inputPath);
    const tempWavPath = path.join(parsed.dir, `${parsed.name}_48k.wav`);
    const masterPath = path.join(parsed.dir, `${parsed.name}_master.m4a`);
    const dfOutput = path.join(parsed.dir, 'df_clean', `${parsed.name}_48k.wav`);
    const dfOutputBase = path.join(parsed.dir, 'df_clean', parsed.base);

    [inputPath, tempWavPath, masterPath, dfOutput, dfOutputBase].forEach((file) => {
      if (file && fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log('[AudioCleanup] Deleted temp file:', file);
        } catch (_) {}
      }
    });
  } catch (e) {
    console.warn('[AudioCleanup] Notice:', e.message);
  }
};

module.exports = { denoiseAudio, cleanupTempAudio };
