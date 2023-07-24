export default function Logs(props: any) {
	// const [internalMs, setInternalMs] = useState(100);
	return (
		<div className='logs-ctn'>
			{props.logs.map((log: string, idx: number) => (
				<li className='log-li' key={idx}>
					{log}
				</li>
			))}
		</div>
	);
}
