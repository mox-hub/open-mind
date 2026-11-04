use base64::Engine;
use std::fs;
use std::path::Path;

/// 原子写：先写临时文件再替换，避免断电/崩溃产生半截文件
fn atomic_write(path: &str, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        let _ = fs::create_dir_all(parent);
    }
    let tmp = format!("{}.tmp", path);
    fs::write(&tmp, bytes).map_err(|e| format!("写入临时文件失败: {}", e))?;
    // Windows 上 std::fs::rename 会替换已存在的目标文件
    fs::rename(&tmp, path).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        format!("替换文件失败: {}", e)
    })
}

#[tauri::command]
fn open_document(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("文件不存在: {}", path));
    }
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

#[tauri::command]
fn read_file_base64(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("文件不存在: {}", path));
    }
    let bytes = fs::read(&path).map_err(|e| format!("读取文件失败: {}", e))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
fn save_document(path: String, content: String) -> Result<(), String> {
    atomic_write(&path, content.as_bytes())
}

#[tauri::command]
fn save_file_base64(path: String, base64: String) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|e| format!("base64 解码失败: {}", e))?;
    atomic_write(&path, &bytes)
}

/// 用系统默认浏览器打开链接（不经 webview 导航）
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("仅支持 http/https 链接".to_string());
    }
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &url])
        .spawn()
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(())
}

/// 在资源管理器中定位文件（打开所在文件夹并选中）
#[tauri::command]
fn reveal_in_folder(path: String) -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    if !Path::new(&path).exists() {
        return Err(format!("文件不存在: {}", path));
    }
    // explorer /select, 要求反斜杠路径；raw_arg 避免引号被二次转义
    let win_path = path.replace('/', "\\");
    std::process::Command::new("explorer")
        .raw_arg(format!("/select,\"{}\"", win_path))
        .spawn()
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_document,
            save_document,
            save_file_base64,
            read_file_base64,
            open_url,
            reveal_in_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenMind");
}
