import { useState, useEffect } from "react";
import React from "react";

function AnAction(action: Action) {
	if (
		(action.actionType === "Move Mouse" || action.actionType === "移动鼠标") &&
		action.moveType === "absolute"
	) {
		return (
			<p>
				<span>
					move mouse to position {action.coor[0]},{action.coor[1]} at screen
				</span>
				<span> , after {action.delay} ms </span>
			</p>
		);
	} else if (
		(action.actionType === "Move Mouse" || action.actionType === "移动鼠标") &&
		action.moveType === "relative"
	) {
		return (
			<p>
				<span>
					move mouse to position {action.coor[0]},{action.coor[1]} relative to
					the image
				</span>
				<span> , after {action.delay} ms </span>
			</p>
		);
	} else if (
		action.actionType === "Press key" ||
		action.actionType === "按键"
	) {
		if (action.keyType === "0-9,a-z") {
			return (
				<p>
					<span>
						press {action.key} for {action.pressDuration} ms
					</span>
					<span> , after {action.delay} ms </span>
				</p>
			);
		} else {
			return (
				<p>
					<span>
						press {action.specialKey} for {action.pressDuration} ms
					</span>
					<span> , after {action.delay} ms </span>
				</p>
			);
		}
	} else {
		return (
			<p>
				<span>send text {action.text}</span>
				<span> , after {action.delay} ms </span>
			</p>
		);
	}
}

const ImageDisplay = (props: any) => {
	const [url, setUrl] = useState(null); // state to store the url

	useEffect(() => {
		// use an async function to get the url from props
		async function getUrl() {
			const url = await props.imageDisplayUrl(props.imagePath);
			setUrl(url); // update the state with the url
		}
		getUrl(); // call the function
	}, [props.imagePath, props.imageDisplayUrl]); // pass dependencies to useEffect

	// render the image with the url or a placeholder
	return <img className='saved-rule-img' src={url || ""} alt='' />;
};

export default function SavedRules(props: any) {
	return (
		<div>
			{props.savedRules.map((rule: Rule, ruleIdx: number) => (
				<div key={ruleIdx} className='a-saved-rule'>
					{/* <p>{rule.ruleName === "" ? ruleIdx + 1 : rule.ruleName}</p> */}
					<div className='img-and-name'>
						<span>
							<ImageDisplay
								imagePath={rule.imagePath}
								imageDisplayUrl={props.imageDisplayUrl}
							/>
							<span>{rule.imageName}</span>
						</span>
						<span>Confidence: {rule.confidence}</span>
					</div>
					{rule.actions.map((action: Action, actionIdx: number) => {
						return (
							<div key={actionIdx}>
								<AnAction {...(action = action)} />
							</div>
						);
					})}
					<div className='a-saved-rule-buttons'>
						<button
							title='是否启用'
							onClick={() => props.toggleEnableThisRule(ruleIdx)}
						>
							{rule.enabled ? "Enabled" : "Disabled"}
						</button>
						{/* <button title='复制规则'>Copy</button> */}
						<button
							title='delete this rule'
							onClick={() => props.deleteThisRule(ruleIdx)}
						>
							x
						</button>
					</div>
				</div>
			))}
		</div>
	);
}
