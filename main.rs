// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use enigo::*;
use opencv::prelude::MatTraitConst;
// import the Screen type
use opencv::prelude::Mat;
use opencv::{core, imgcodecs, imgproc};
use screenshots::Screen;
use std::error::Error;

fn screenshot_buffer() -> Result<Vec<u8>, Box<dyn Error>> {
    // get all the screens
    let screens = Screen::all()?;
    // get the main screen
    let main_screen = &screens[0];
    // capture the image of the main screen
    let image = main_screen.capture()?;
    // convert the image to a vector of bytes
    let buffer = image.to_png()?;
    Ok(buffer)
}

fn find_img_return_coor(
    small: &str,
    bigbuff: Vec<u8>,
    confidence: f64,
) -> Result<(i32, i32), Box<dyn Error>> {
    // load the small image and the big image from the paths
    let small = imgcodecs::imread(small, imgcodecs::IMREAD_COLOR)?;
    // let big = Mat::from_slice(&bigbuff)?;
    let big: Mat = imgcodecs::imdecode(
        &opencv::types::VectorOfu8::from_iter(bigbuff),
        imgcodecs::IMREAD_COLOR,
    )?;

    // get the width and height of the small image
    let w = small.cols();
    let h = small.rows();

    // choose a comparison method for template matching (see https://docs.rs/opencv/latest/opencv/imgproc/fn.match_template.html for details)
    let method = imgproc::TM_CCOEFF_NORMED;

    // apply template matching and get the result image
    let mut res =
        core::Mat::new_rows_cols_with_default(0, 0, core::CV_8UC3, core::Scalar::all(0.0))?;
    imgproc::match_template(
        &big,
        &small,
        &mut res,
        method,
        &core::Mat::new_rows_cols_with_default(0, 0, core::CV_8UC3, core::Scalar::all(0.0))?,
    )?;

    // find the maximum value and its location in the result image
    let mut min_val = 0.0;
    let mut max_val = 0.0;
    let mut min_loc = core::Point::new(0, 0);
    let mut max_loc = core::Point::new(0, 0);
    core::min_max_loc(
        &res,
        Some(&mut min_val),
        Some(&mut max_val),
        Some(&mut min_loc),
        Some(&mut max_loc),
        &core::Mat::default(),
    )?;

    // draw a rectangle around the matched region on the big image
    let top_left = max_loc;
    println!(
        "best match center x:{},y:{},max_val:{}",
        top_left.x + w / 2,
        top_left.y + h / 2,
        max_val
    );
    let r = (top_left.x + w / 2, top_left.y + h / 2);
    if max_val >= confidence {
        Ok(r)
    } else {
        Ok((-1, -1))
    }
}

#[tauri::command]
fn find_image(image: &str, confidence: f64) -> Result<(i32, i32), String> {
    let bf = screenshot_buffer().map_err(|err| err.to_string())?;
    let coor = find_img_return_coor(image, bf, confidence).map_err(|err| err.to_string())?;
    println!("{:?}", coor);
    Ok(coor)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_cursor_position() -> (i32, i32) {
    //获取鼠标的坐标
    let enigo = Enigo::new();
    let (x, y) = enigo.mouse_location();
    println!("The mouse cursor is at ({}, {})", x, y);
    (x, y)
}

#[tauri::command]
fn send_text(some_string: &str) {
    let mut enigo = Enigo::new();
    enigo.key_sequence(some_string);
}

#[tauri::command]
fn move_mouse(x: i32, y: i32) -> Result<String, String> {
    let mut enigo = Enigo::new();
    enigo.mouse_move_to(x, y);
    Ok("ok".to_string())
}

#[tauri::command]
fn normal_key_down(key: char) -> Result<String, String> {
    let mut enigo = Enigo::new();
    enigo.key_down(Key::Layout(key));
    Ok("ok".to_string())
}

#[tauri::command]
fn normal_key_up(key: char) -> Result<String, String> {
    let mut enigo = Enigo::new();
    enigo.key_up(Key::Layout(key));
    Ok("ok".to_string())
}

#[tauri::command]
fn special_key_down(key: &str) -> Result<String, String> {
    let mut enigo = Enigo::new();
    match key {
        "MouseButtonLeft" => {
            enigo.mouse_down(MouseButton::Left);
        }
        "MouseButtonRight" => {
            enigo.mouse_down(MouseButton::Right);
        }
        "Windows" | "Super" | "Command" => {
            enigo.key_down(Key::Meta);
        }
        "Esc" => {
            enigo.key_down(Key::Escape);
        }
        "Tab" => {
            enigo.key_down(Key::Tab);
        }
        "CapsLock" => {
            enigo.key_down(Key::CapsLock);
        }
        "Shift" => {
            enigo.key_down(Key::Shift);
        }
        "Control" => {
            enigo.key_down(Key::Control);
        }
        "Alt" => {
            enigo.key_down(Key::Alt);
        }
        "Space" => {
            enigo.key_down(Key::Space);
        }
        "Delete" => {
            enigo.key_down(Key::Delete);
        }
        "Backspace" => {
            enigo.key_down(Key::Backspace);
        }
        "Return" | "Enter" => {
            enigo.key_down(Key::Return);
        }
        "Home" => {
            enigo.key_down(Key::Home);
        }
        "End" => {
            enigo.key_down(Key::End);
        }
        "PageDown" => {
            enigo.key_down(Key::PageDown);
        }
        "PageUp" => {
            enigo.key_down(Key::PageUp);
        }
        "UpArrow" => {
            enigo.key_down(Key::UpArrow);
        }
        "DownArrow" => {
            enigo.key_down(Key::DownArrow);
        }
        "LeftArrow" => {
            enigo.key_down(Key::LeftArrow);
        }
        "RightArrow" => {
            enigo.key_down(Key::RightArrow);
        }
        "F1" => {
            enigo.key_down(Key::F1);
        }
        "F2" => {
            enigo.key_down(Key::F2);
        }
        "F3" => {
            enigo.key_down(Key::F3);
        }
        "F4" => {
            enigo.key_down(Key::F4);
        }
        "F5" => {
            enigo.key_down(Key::F5);
        }
        "F6" => {
            enigo.key_down(Key::F6);
        }
        "F7" => {
            enigo.key_down(Key::F7);
        }
        "F8" => {
            enigo.key_down(Key::F8);
        }
        "F9" => {
            enigo.key_down(Key::F9);
        }
        "F10" => {
            enigo.key_down(Key::F10);
        }
        "F11" => {
            enigo.key_down(Key::F11);
        }
        "F12" => {
            enigo.key_down(Key::F12);
        }
        _ => return Err("key match error".to_string()),
    }
    Ok("ok".to_string())
}

#[tauri::command]
fn special_key_up(key: &str) -> Result<String, String> {
    let mut enigo = Enigo::new();
    match key {
        "MouseButtonLeft" => {
            enigo.mouse_up(MouseButton::Left);
        }
        "MouseButtonRight" => {
            enigo.mouse_up(MouseButton::Right);
        }
        "Windows" | "Super" | "Command" => {
            enigo.key_up(Key::Meta);
        }
        "Esc" => {
            enigo.key_up(Key::Escape);
        }
        "Tab" => {
            enigo.key_up(Key::Tab);
        }
        "CapsLock" => {
            enigo.key_up(Key::CapsLock);
        }
        "Shift" => {
            enigo.key_up(Key::Shift);
        }
        "Control" => {
            enigo.key_up(Key::Control);
        }
        "Alt" => {
            enigo.key_up(Key::Alt);
        }
        "Space" => {
            enigo.key_up(Key::Space);
        }
        "Delete" => {
            enigo.key_up(Key::Delete);
        }
        "Backspace" => {
            enigo.key_up(Key::Backspace);
        }
        "Return" | "Enter" => {
            enigo.key_up(Key::Return);
        }
        "Home" => {
            enigo.key_up(Key::Home);
        }
        "End" => {
            enigo.key_up(Key::End);
        }
        "PageDown" => {
            enigo.key_up(Key::PageDown);
        }
        "PageUp" => {
            enigo.key_up(Key::PageUp);
        }
        "UpArrow" => {
            enigo.key_up(Key::UpArrow);
        }
        "DownArrow" => {
            enigo.key_up(Key::DownArrow);
        }
        "LeftArrow" => {
            enigo.key_up(Key::LeftArrow);
        }
        "RightArrow" => {
            enigo.key_up(Key::RightArrow);
        }
        "F1" => {
            enigo.key_up(Key::F1);
        }
        "F2" => {
            enigo.key_up(Key::F2);
        }
        "F3" => {
            enigo.key_up(Key::F3);
        }
        "F4" => {
            enigo.key_up(Key::F4);
        }
        "F5" => {
            enigo.key_up(Key::F5);
        }
        "F6" => {
            enigo.key_up(Key::F6);
        }
        "F7" => {
            enigo.key_up(Key::F7);
        }
        "F8" => {
            enigo.key_up(Key::F8);
        }
        "F9" => {
            enigo.key_up(Key::F9);
        }
        "F10" => {
            enigo.key_up(Key::F10);
        }
        "F11" => {
            enigo.key_up(Key::F11);
        }
        "F12" => {
            enigo.key_up(Key::F12);
        }
        _ => return Err("key match error".to_string()),
    }
    Ok("ok".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            find_image,
            get_cursor_position,
            send_text,
            move_mouse,
            normal_key_down,
            normal_key_up,
            special_key_down,
            special_key_up
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
