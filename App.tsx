import { useRef, useState, useEffect } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import {
	copyFile,
	exists,
	createDir,
	writeBinaryFile,
	BaseDirectory,
} from "@tauri-apps/api/fs";
import { resolveResource, extname, appDataDir } from "@tauri-apps/api/path";
import { unregister, registerAll } from "@tauri-apps/api/globalShortcut";
import BotButtons from "./BotButtons";
import SavedRules from "./SavedRules";
import Logs from "./Logs";
import NewRuleImg from "./NewRuleImg";
import NewRuleActions from "./NewRuleActions";

function App() {
	const defaultAction: Action = {
		actionType: "Move Mouse", //Move Mouse(relative to image location,absolute),Press(Key, Special Key),Send Text
		moveType: "relative",
		coor: [0, 0],
		keyType: "0-9,a-z",
		key: "q",
		specialKey: "MouseButtonLeft",
		pressDuration: 0,
		text: "",
		delay: 0,
	};
	const defaultRule: Rule = {
		confidence: 0.9,
		imagePath: "",
		imageName: "",
		ruleName: "",
		actions: [defaultAction],
		enabled: true,
	};
	const specialKeys =
		"MouseButtonLeft,MouseButtonRight,Windows,Super,Command,Esc,Tab,CapsLock,Shift,Control,Alt,Space,Delete,Backspace,Return,Enter,Home,End,PageDown,PageUp,UpArrow,DownArrow,LeftArrow,RightArrow,F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12".split(
			","
		);
	//states
	// const [savedRules, setSavedRules] = useState([
	// 	JSON.parse(JSON.stringify(defaultRule)),
	// ]);
	const [showNewRule, setShowNewRule] = useState(false);
	const [savedRules, setSavedRules] = useState<Rule[]>(() => {
		const localSavedRules = localStorage.getItem("localSavedRules");
		if (localSavedRules == null) return [];
		return JSON.parse(localSavedRules);
	});
	const [startBtnTxt, setStartBtnTxt] = useState("Start");
	const [positionBtnText, setPositionBtnText] = useState("Get Cursor Position");
	const [internalMs, setInternalMs] = useState<number>(() => {
		const localInternal = localStorage.getItem("localInternal");
		if (localInternal == null) return 2000;
		return parseInt(localInternal);
	});
	const [foldRules, setFoldRules] = useState("Fold all");
	const [logs, setLogs] = useState(["have fun"]);
	const [newRule, setNewRule] = useState<Rule>(
		JSON.parse(JSON.stringify(defaultRule))
	);
	// ref
	// use a useRef hook to store and access the current value of the state
	const isDoingActions = useRef(false);
	const shortcutRegistered = useRef(false);
	const newRuleImagePath = useRef("");
	const newRuleImgType = useRef("");
	const newRuleImgBinaryString = useRef(new Uint8Array([]));
	const startBtnTxtRef = useRef(startBtnTxt);
	// EFFECTS
	//localstorage
	useEffect(() => {
		localStorage.setItem("localSavedRules", JSON.stringify(savedRules));
	}, [savedRules]);
	useEffect(() => {
		localStorage.setItem("localInternal", internalMs.toString());
	}, [internalMs]);
	//on mount init
	useEffect(() => {
		async function checkAndCreateDir() {
			try {
				//初始化
				// Check if the `$APPDATA/avatar.png` file exists
				let checkPath = await exists("test", { dir: BaseDirectory.AppData });
				console.debug(`checkPath:${checkPath}`);
				if (!checkPath) {
					await createDir("test", {
						dir: BaseDirectory.AppData,
						recursive: true,
					});
					const testImggePath = await testImgPath();
					// Copy the `test.png` file to `$APPCONFIG/app.conf.bk`
					await copyFile(testImggePath, "test/test.png", {
						dir: BaseDirectory.AppData,
					});
					const appDataDirPath = await appDataDir();
					let initRule: Rule = {
						confidence: 0.9,
						imagePath: appDataDirPath + "test/test.png",
						imageName: "test.png",
						ruleName: "test rule",
						actions: [JSON.parse(JSON.stringify(defaultAction))],
						enabled: true,
					};
					setSavedRules([initRule]);
				} else {
					console.debug("not init");
				}
			} catch (error) {
				newLog(`${error}`);
			}
		}
		checkAndCreateDir();
	}, []); // run only once on mount
	// unregister("Alt+I");
	useEffect(() => {
		async function registerShortCut() {
			try {
				//注册快捷键
				// newLog(`alt + i (option + i on mac) to start / stop bot`);
				await unregister("Alt+I");
				await unregister("Option+I");
				await registerAll(["Alt+I", "Option+I"], (shortcut) => {
					newLog(`${getTimeNow()} ${shortcut}`);
					startBot();
				});
				shortcutRegistered.current = true;
			} catch (error) {
				// newLog(`${error}`);
				console.debug(error);
			}
		}
		if (!shortcutRegistered.current) {
			registerShortCut();
		}
	}, []);
	// 开始/停止 获取鼠标位置
	useEffect(() => {
		// check positionBtnText === "Stop Get Position" before creating the interval
		if (positionBtnText === "Stop Get Position") {
			// create the interval function every second
			const intervalId = setInterval(async () => {
				try {
					const position: number[] = await invoke("get_cursor_position");
					newLog(`${position[0]}, ${position[1]}`);
				} catch (error) {
					newLog("get cursor position failed");
				}
			}, 1000);

			// return a cleanup function that clears the interval
			return () => {
				clearInterval(intervalId);
			};
		}
	}, [positionBtnText]); // pass state as a dependency to useEffect

	//开始/停止bot
	useEffect(() => {
		// update the ref value whenever the state changes
		startBtnTxtRef.current = startBtnTxt;
		// check positionBtnText === "Stop" before creating the interval
		let botInternalMs = 1000;
		if (internalMs >= 1000) {
			botInternalMs = internalMs;
		} else {
			setInternalMs(1000);
			newLog("bot internal should be greater than 1000ms");
		}
		let enabledRules: Rule[] = [];
		for (const rule of savedRules) {
			if (rule.enabled) {
				enabledRules.push(rule);
			}
		}
		if (enabledRules.length === 0) {
			setStartBtnTxt("Start");
			newLog(`No rule ,bot stop`);
		}
		if (startBtnTxtRef.current === "Stop") {
			enabledRules.forEach((rule, index) => {
				setTimeout(async () => {
					runBot(rule, index); // call the runBot function with the rule and index
				}, botInternalMs * index);
			});
			//开始bot
			// create the interval function every second
			const intervalBot = setInterval(async () => {
				enabledRules.forEach((rule, index) => {
					setTimeout(async () => {
						runBot(rule, index); // call the runBot function with the rule and index
					}, botInternalMs * index);
				});
			}, botInternalMs * enabledRules.length);

			// return a cleanup function that clears the interval
			return () => {
				clearInterval(intervalBot);
			};
		}
	}, [startBtnTxt]);

	// functions
	async function runBot(rule: Rule, index: number) {
		if (!isDoingActions.current) {
			try {
				const r: any = await findImage(rule.imagePath, rule.confidence);
				if (r[0] >= 0 && startBtnTxtRef.current === "Stop") {
					isDoingActions.current = true; //状态设为正在执行动作
					//多久后状态设为不太执行动作？
					let actionsTime = actionTimer(rule);
					setTimeout(() => {
						isDoingActions.current = false;
					}, actionsTime);
					//found image
					//found
					newLog(`${getTimeNow()} find image at ${r}`);
					doActions(rule.actions, r);
				} else {
					//not found
					newLog(`${getTimeNow()}->${rule.imageName} not found`);
				}
				// newLog(`bot working`);
			} catch (error) {
				newLog("bot failed");
				newLog(`${error}`);
			}
		}
	}
	//toggle enable rule
	function toggleEnableThisRule(i: number) {
		let savedRulesUpdate: Rule[] = JSON.parse(JSON.stringify(savedRules));
		savedRulesUpdate[i].enabled = !savedRulesUpdate[i].enabled;
		setSavedRules(savedRulesUpdate);
	}
	//获取时间
	function getTimeNow() {
		// create a new Date object
		let date = new Date();
		// get the hours, minutes and seconds from the date object
		let hours = date.getHours();
		let minutes = date.getMinutes();
		let seconds = date.getSeconds();
		// pad with leading zeros if needed
		let hoursStr = hours < 10 ? "0" + hours.toString() : hours;
		let minutesStr = minutes < 10 ? "0" + minutes.toString() : minutes;
		let secondsStr = seconds < 10 ? "0" + seconds.toString() : seconds;
		// return the time as a string
		return hoursStr + ":" + minutesStr + ":" + secondsStr;
	}
	//doActions
	function doActions(actions: Action[], imageLocation: number[]) {
		actions.forEach((action) => {
			try {
				if (
					action.actionType === "Move Mouse" &&
					action.moveType === "relative"
				) {
					setTimeout(async () => {
						const desLocation = [
							imageLocation[0] + action.coor[0],
							imageLocation[1] + action.coor[1],
						];
						await invoke("move_mouse", {
							x: desLocation[0],
							y: desLocation[1],
						});
						newLog(
							`${getTimeNow()} mouse move to ${
								action.coor
							} to the image location`
						);
					}, action.delay);
				} else if (
					action.actionType === "Move Mouse" &&
					action.moveType === "absolute"
				) {
					setTimeout(async () => {
						await invoke("move_mouse", {
							x: action.coor[0],
							y: action.coor[1],
						});
						newLog(`${getTimeNow()} mouse move to ${action.coor} `);
					}, action.delay);
				} else if (action.actionType === "Press key") {
					if (action.keyType === "0-9,a-z") {
						setTimeout(async () => {
							await invoke("normal_key_down", { key: action.key });
							newLog(`${getTimeNow()} ${action.key} key down`);
						}, action.delay);
						setTimeout(async () => {
							await invoke("normal_key_up", { key: action.key });
							newLog(`${getTimeNow()} ${action.key} key up`);
						}, action.delay + action.pressDuration);
					} else {
						setTimeout(async () => {
							await invoke("special_key_down", { key: action.specialKey });
							newLog(`${getTimeNow()} ${action.specialKey} key down`);
						}, action.delay);
						setTimeout(async () => {
							await invoke("special_key_up", { key: action.specialKey });
							newLog(`${getTimeNow()} ${action.specialKey} key up`);
						}, action.delay + action.pressDuration);
					}
				} else if (action.actionType === "Send Text") {
					setTimeout(async () => {
						await invoke("send_text", { some_string: action.text });
					}, action.delay);
				}
			} catch (error) {
				newLog("${getTimeNow()} Action error:");
				newLog(`${getTimeNow()} ${error}`);
			}
		});
	}
	//action timer
	function actionTimer(rule: Rule) {
		let timer = 1000;
		for (const action of rule.actions) {
			if (action.actionType === "Press key" || action.actionType === "按键") {
				let delay = action.delay + action.pressDuration;
				if (delay > timer) {
					timer = delay;
				}
			} else {
				if (action.delay > timer) {
					timer = action.delay;
				}
			}
		}
		return timer;
	}
	// savedRules functions
	async function imageDisplayUrl(imagePath: string) {
		console.debug(`imagePath:${imagePath}`);
		const assetUrl = convertFileSrc(imagePath);
		return assetUrl;
	}
	function deleteThisRule(ruleIdx: number) {
		let savedRulesUpdate = JSON.parse(JSON.stringify(savedRules));
		savedRulesUpdate.splice(ruleIdx, 1);
		setSavedRules(savedRulesUpdate);
	}
	//new rule functions
	function deleteNewRuleAction(actionIdx: number) {
		let newRuleUpdate = { ...newRule };
		newRuleUpdate.actions.splice(actionIdx, 1);
		setNewRule(newRuleUpdate); // update the state
	}
	function updateNewRuleActions(actionIdx: number, newAction: Action) {
		//change new rule actions
		console.debug(`actionIdx ${actionIdx}`);
		console.debug(`newAction ${newAction}`);
		let newRuleUpdate = { ...newRule }; // make a copy of the state
		newRuleUpdate.actions[actionIdx] = newAction;
		setNewRule(newRuleUpdate); // update the state
	}
	function addNewAction() {
		let newRuleActions = { ...newRule }.actions;
		newRuleActions.push({ ...defaultAction });
		setNewRule({ ...newRule, actions: newRuleActions });
	}
	async function confirmNewRule() {
		let writeFileOk = await writeNewImage(newRuleImgBinaryString.current);
		if (writeFileOk) {
			console.debug("writeFile successful ", writeFileOk);
			console.debug("newRule:", newRule);
			let savedRulesUpdate: Rule[] = JSON.parse(JSON.stringify(savedRules));
			let checkConfidence = JSON.parse(JSON.stringify(newRule)).confidence;
			savedRulesUpdate.unshift({
				...newRule,
				imagePath: newRuleImagePath.current,
				enabled: true,
				confidence:
					checkConfidence >= 0 && checkConfidence <= 1 ? checkConfidence : 0.9,
			});
			setSavedRules(JSON.parse(JSON.stringify(savedRulesUpdate)));
			console.debug(savedRules);
			newLog(`new rule added`);
		} else {
			newLog(`add new rule failed`);
		}
		//add new rule to saved rules
	}
	async function testImgPath() {
		const resourceTestPngPath = await resolveResource(
			"../src/testImg/test.png"
		);
		return resourceTestPngPath;
	}
	function startBot() {
		// use the ref value to set the state based on the latest value
		setStartBtnTxt(startBtnTxtRef.current === "Start" ? "Stop" : "Start");
		newLog(
			startBtnTxtRef.current === "Start"
				? `${getTimeNow()} Start bot...`
				: `${getTimeNow()} Stop bot`
		);
	}
	function foldAll() {
		setFoldRules(foldRules === "Fold all" ? "Unfold all" : "Fold all");
	}
	function getPosition() {
		// toggle the button text and the interval
		let isRunning = positionBtnText === "Get Cursor Position";
		setPositionBtnText(isRunning ? "Stop Get Position" : "Get Cursor Position");
		newLog(`${getTimeNow()} ${positionBtnText}`);
	}
	async function findImage(path: string, confidence: number) {
		const r = await invoke("find_image", {
			image: path,
			confidence: confidence,
		});
		return r;
	}
	async function toggleNewRule() {
		setShowNewRule(showNewRule ? false : true);
	}
	function newLog(log: string) {
		setLogs((prevLogs) => {
			// create a new array with the new log and the previous logs
			const newLogs = [log, ...prevLogs];
			// check if the new array has more than 30 elements
			if (newLogs.length > 18) {
				// remove the last element from the new array
				newLogs.pop();
			}
			// return the new array as the new state value
			return newLogs;
		});
	}
	async function newRuleImgChose(e: React.ChangeEvent<HTMLInputElement>) {
		// console.debug(e);
		// check if files is not null
		try {
			if (e.target.files) {
				const ext = await extname(e.target.files[0].name);
				setNewRule({ ...newRule, imageName: e.target.files[0].name }); //设置newRule 中的图片名称
				console.debug(newRule);
				console.debug(`ext${ext}`);
				newLog(`imgType::${ext}`);
				newRuleImgType.current = ext;
				// get the first file object
				const file = e.target.files[0];

				var reader = new FileReader();
				reader.onload = function () {
					// newLog(`type,,,${typeof reader.result}`);
					var arrayBuffer = reader.result as ArrayBuffer; // cast the result to ArrayBuffer
					let u8array = new Uint8Array(arrayBuffer);
					console.log(u8array);
					newRuleImgBinaryString.current = u8array;
				};
				reader.readAsArrayBuffer(file);
				reader.onerror = function (e) {
					console.debug(`read file error ${e}`);
					newLog(`read file error: ${e}`);
				};
			}
		} catch (error) {
			newLog(`read file error ${error}`);
		}
	}
	async function writeNewImage(binaryString: Uint8Array) {
		// Check if the `$APPDATA/avatar.png` file exists
		let checkPath = await exists("test", { dir: BaseDirectory.AppData });
		console.debug(`checkPath:${checkPath}`);
		if (!checkPath) {
			await createDir("test", { dir: BaseDirectory.AppData, recursive: true });
		}
		try {
			if (newRuleImgType.current === "") {
				return false;
			}
			const appDataDirPath = await appDataDir();
			console.debug(`appDataDirPath:${appDataDirPath}`);
			let now = Date.now().toString();
			let imgName = now + "." + newRuleImgType.current;
			// newLog(`imgName:${imgName}`);
			//新 rule 中 图片的地址
			let newRuleImgPath = appDataDirPath + imgName;
			// newLog(`newRuleImgPath:${newRuleImgPath}`);
			// setNewRuleImgPath(appDataDirPath + imgName);
			// Write a binary file to the `$APPDATA/avatar.png` path
			await writeBinaryFile(imgName, binaryString, {
				dir: BaseDirectory.AppData,
			});
			newRuleImagePath.current = newRuleImgPath;
			console.debug(`write file ok`);
			return true;
		} catch (error) {
			newLog(`write file error:${error}`);
			return false;
		}
	}

	//   render
	return (
		<div className='ctn'>
			{/* settings component */}
			<div className='settings-ctn'>
				<div className='sticky-ctn'>
					<BotButtons
						toggleNewRule={toggleNewRule}
						foldAll={foldAll}
						foldRules={foldRules}
						getPosition={getPosition}
						positionBtnText={positionBtnText}
						internalMs={internalMs}
						setInternalMs={setInternalMs}
						startBot={startBot}
						startBtnTxt={startBtnTxt}
					/>

					<div
						className='new-rule-div'
						style={{
							display: showNewRule ? "block" : "none",
							opacity: showNewRule ? "1" : "0",
						}}
					>
						<NewRuleImg
							newRuleImgChose={newRuleImgChose}
							newRule={newRule}
							setNewRule={setNewRule}
						/>
						<p>Actions after find image</p>
						<NewRuleActions
							newRule={newRule}
							setNewRule={setNewRule}
							updateNewRuleActions={updateNewRuleActions}
							specialKeys={specialKeys}
							deleteNewRuleAction={deleteNewRuleAction}
							addNewAction={addNewAction}
						/>
						<div>
							<button onClick={confirmNewRule} className='confirm-new-rule'>
								Confirm New Rule
							</button>
						</div>
					</div>
				</div>
				{savedRules.length >= 1 && (
					<SavedRules
						savedRules={savedRules}
						deleteThisRule={deleteThisRule}
						imageDisplayUrl={imageDisplayUrl}
						toggleEnableThisRule={toggleEnableThisRule}
					/>
				)}
			</div>

			{/* logs component */}
			<Logs logs={logs} />
		</div>
	);
}

export default App;
