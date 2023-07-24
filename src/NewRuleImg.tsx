interface TheProps {
	newRule: Rule; // assuming you have a Rule type defined somewhere
	newRuleImgChose: (e: React.ChangeEvent<HTMLInputElement>) => void;
	setNewRule: React.Dispatch<React.SetStateAction<Rule>>;
}

export default function NewRuleImg(props: TheProps) {
	// const [internalMs, setInternalMs] = useState(100);
	return (
		<div className='image-choose'>
			<input
				type='file'
				id='newRuleImg'
				name='img'
				accept='image/jpeg, image/png'
				onChange={(e) => {
					props.newRuleImgChose(e);
				}}
			/>
			<span>
				<span title='确定程度'>Confidence(0-1):</span>
				<input
					type='number'
					className='input-small'
					value={props.newRule.confidence}
					onChange={(e) => {
						props.setNewRule({
							...props.newRule,
							confidence: parseFloat(e.target.value),
						});
					}}
				/>
			</span>
		</div>
	);
}
