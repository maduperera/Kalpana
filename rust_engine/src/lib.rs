use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct KalpanaState {
    bands: usize,
    dim: usize,
    state_re: Vec<f32>,
    state_im: Vec<f32>,
    o3: Vec<f32>,
    p4: Vec<f32>,
}

#[wasm_bindgen]
impl KalpanaState {
    #[wasm_bindgen(constructor)]
    pub fn new(bands: usize) -> KalpanaState {
        let dim = 371;
        let mut o3 = vec![0.0; bands];
        let mut p4 = vec![0.0; bands];
        
        let min_freq = 3e-4;
        let max_freq = 0.35;
        let s = (max_freq - min_freq) / (if bands > 1 { bands - 1 } else { 1 }) as f32;
        
        for i in 0..bands {
            o3[i] = min_freq + (i as f32) * s;
            p4[i] = 0.35 * (js_sys::Math::random() as f32); // Use JS random for WASM compatibility
        }

        KalpanaState {
            bands,
            dim,
            state_re: vec![0.0; bands * dim],
            state_im: vec![0.0; bands * dim],
            o3,
            p4,
        }
    }

    pub fn write_rif(&mut self, t: f32, emb: &[f32]) {
        for i in 0..self.bands {
            let angle = 10.0 * self.o3[i] * t + self.p4[i];
            let cr = angle.cos();
            let ci = angle.sin();
            let offset = i * self.dim;
            
            for j in 0..self.dim {
                let val = if j < emb.len() { emb[j] } else { 0.0 };
                self.state_re[offset + j] += val * cr;
                self.state_im[offset + j] += val * ci;
            }
        }
    }

    pub fn read_rif(&self, t: f32, qv: &[f32]) -> f32 {
        let mut score = 0.0;
        let mut norm_a = 0.0;
        let mut norm_b = 0.0;
        let epsilon = 1e-8;

        for i in 0..self.bands {
            let angle = 10.0 * self.o3[i] * t + self.p4[i];
            let cr = angle.cos();
            let ci = angle.sin();
            let offset = i * self.dim;

            for j in 0..self.dim {
                let re = self.state_re[offset + j];
                let im = self.state_im[offset + j];
                let rv = (re * cr) + (im * ci);
                let q_val = if j < qv.len() { qv[j] } else { 0.0 };
                
                score += q_val * rv;
                norm_a += q_val * q_val;
                norm_b += rv * rv;
            }
        }

        score / ((norm_a.sqrt() * norm_b.sqrt()) + epsilon)
    }

    pub fn get_version(&self) -> String {
        "4.0.0-rust-vault".to_string()
    }
}
