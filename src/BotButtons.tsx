export default function BotButtons(props: any) {
	return (
		<div className='bot-buttons'>
			<button onClick={props.toggleNewRule}>+ New Rule</button>
			<button onClick={props.getPosition} title='get mouse position per second'>
				{props.positionBtnText}
			</button>
			{/* <button onClick={props.foldAll}>{props.foldRules}</button> */}
			<span title='找图时间间隔'>
				internal:
				<input
					className='input-small'
					type='number'
					placeholder='1000'
					value={props.internalMs}
					onChange={(e) => {
						props.setInternalMs(parseInt(e.target.value));
					}}
					title='Time between detecting image'
				/>
				<span> ms</span>
			</span>
			<button
				className='start-btn'
				onClick={props.startBot}
				title='Alt+I (Option+I)'
			>
				{props.startBtnTxt}
			</button>
		</div>
	);
}
