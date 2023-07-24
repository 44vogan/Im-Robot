interface NewRuleProps {
	newRule: Rule; // assuming you have a Rule type defined somewhere
	setNewRule: (rule: Rule) => void;
	addNewAction: () => void;
	updateNewRuleActions: (actionIdx: number, newAction: Action) => void;
	specialKeys: string[];
	deleteNewRuleAction: (actionIdx: number) => void;
}

export default function NewRuleActions(props: NewRuleProps) {
	// const [internalMs, setInternalMs] = useState(100);
	return (
		<>
			{props.newRule.actions.map(
				(action: Action, actionIdx: number, array: Action[]) => {
					return (
						<div key={actionIdx} className='new-rule-action'>
							<span>action {actionIdx + 1}</span>

							<select
								onChange={(e) =>
									props.updateNewRuleActions(actionIdx, {
										...action,
										actionType: e.target.value as Action["actionType"],
									})
								}
							>
								<option title='移动鼠标'>Move Mouse</option>
								<option title='按键'>Press key</option>
								<option title='发送文字'>Send Text</option>
							</select>
							{action.actionType === "Move Mouse" && (
								<>
									<select
										onChange={(e) =>
											props.updateNewRuleActions(actionIdx, {
												...action,
												moveType: e.target.value as Action["moveType"],
											})
										}
									>
										<option title='相对图片位置'>relative</option>
										<option title='绝对坐标'>absolute</option>
									</select>
									<input
										title='x'
										className='input-small'
										type='number'
										placeholder='0'
										value={action.coor[0]}
										onChange={(e) =>
											props.updateNewRuleActions(actionIdx, {
												...action,
												coor: [parseInt(e.target.value), { ...action }.coor[1]],
											})
										}
									/>
									<input
										title='y'
										className='input-small'
										type='number'
										placeholder='0'
										value={action.coor[1]}
										onChange={(e) =>
											props.updateNewRuleActions(actionIdx, {
												...action,
												coor: [{ ...action }.coor[0], parseInt(e.target.value)],
											})
										}
									/>
								</>
							)}
							{action.actionType === "Press key" && (
								<>
									<select
										onChange={(e) =>
											props.updateNewRuleActions(actionIdx, {
												...action,
												keyType: e.target.value as Action["keyType"],
											})
										}
									>
										<option title='0-9,a-z'>0-9,a-z</option>
										<option title='特殊按键'>special key</option>
									</select>
									{action.keyType === "0-9,a-z" && (
										<input
											className='input-small'
											type='text'
											size={1}
											maxLength={1}
											title='0-9,a-z'
											value={action.key}
											onChange={(e) =>
												props.updateNewRuleActions(actionIdx, {
													...action,
													key: e.target.value,
												})
											}
										/>
									)}
									{action.keyType === "special key" && (
										<select
											onChange={(e) =>
												props.updateNewRuleActions(actionIdx, {
													...action,
													specialKey: e.target.value,
												})
											}
										>
											{props.specialKeys.map(
												(specialKey: string, specialKeyIdx: number) => {
													return <option key={specialKey}>{specialKey}</option>;
												}
											)}
										</select>
									)}
									<span title='按键时长'>
										Duration:
										<input
											className='input-small'
											title='ms'
											type='number'
											value={action.pressDuration}
											onChange={(e) =>
												props.updateNewRuleActions(actionIdx, {
													...action,
													pressDuration: parseInt(e.target.value),
												})
											}
										/>
									</span>
								</>
							)}
							{action.actionType === "Send Text" && (
								<input
									type='text'
									value={action.text}
									onChange={(e) =>
										props.updateNewRuleActions(actionIdx, {
											...action,
											text: e.target.value,
										})
									}
								/>
							)}
							<span title='动作延迟时间'>
								Delay:
								<input
									className='input-small'
									title='ms'
									type='number'
									value={action.delay}
									onChange={(e) =>
										props.updateNewRuleActions(actionIdx, {
											...action,
											delay: parseInt(e.target.value),
										})
									}
								/>
							</span>
							{array.length > 1 && (
								<button
									title='delete this action'
									onClick={() => props.deleteNewRuleAction(actionIdx)}
								>
									-
								</button>
							)}
						</div>
					);
				}
			)}
			<button onClick={props.addNewAction} title='add action'>
				+
			</button>
		</>
	);
}
