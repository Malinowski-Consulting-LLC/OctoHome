use tauri::{WebviewUrl, WebviewWindowBuilder};

/// Resolve the production app URL.
///
/// - Debug builds always load the local dev server (`http://localhost:3000`);
///   no environment variable is needed.
/// - Release builds require `APP_URL` to be set in the environment **at
///   compile time**.  If it is missing the build fails with a clear error so
///   no broken binary is ever produced silently.
fn resolve_app_url() -> &'static str {
    #[cfg(debug_assertions)]
    {
        "http://localhost:3000"
    }
    #[cfg(not(debug_assertions))]
    {
        env!(
            "APP_URL",
            "APP_URL must be set at compile time for release builds \
             (e.g. APP_URL=https://octohome.vercel.app cargo tauri build)"
        )
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let url = resolve_app_url()
                .parse::<url::Url>()
                .expect("APP_URL is not a valid URL");

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("OctoHome")
                .inner_size(1280.0, 800.0)
                .min_inner_size(800.0, 600.0)
                .resizable(true)
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
