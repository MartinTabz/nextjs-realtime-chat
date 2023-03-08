import styles from '@/styles/Home.module.css';
import { supabase } from '@/utils/supabase';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
	const messageAreaRef = useRef(null);

	const [jmeno, setJmeno] = useState('');
	const [zprava, setZprava] = useState('');

	const [messages, setMessages] = useState([]);

	useEffect(() => {
		const fetchZpravy = async () => {
			let { data: zpravy, error } = await supabase
				.from('zpravy')
				.select('*')
				.order('created_at', { ascending: true });
			if (!error) {
				setMessages(zpravy);
			}
			messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
		};
		fetchZpravy();
	}, []);

	useEffect(() => {
		const zpravy = supabase
			.channel('custom-insert-channel')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'zpravy' },
				(payload) => {
					setMessages((messages) => [...messages, payload.new]);
					messageAreaRef.current.scrollTop =
						messageAreaRef.current.scrollHeight;
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(zpravy);
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (jmeno.length > 2 || zprava) {
			const { error } = await supabase
				.from('zpravy')
				.insert([{ uzivatel: jmeno, obsah: zprava }]);
			if (!error) {
				setJmeno('');
				setZprava('');
			}
		}
	};

	return (
		<section className={styles.container}>
			<h1>Giga Chat</h1>

			<div className={styles.chatarea}>
				<div className={styles.messagearea} ref={messageAreaRef}>
					{messages.map((message) => (
						<div className={styles.message} key={message.id}>
							<div className={styles.messageinfo}>
								<span className={styles.messagename}>{message.uzivatel}</span>
								<span className={styles.messagetime}>
									{formatovatDatum(message.created_at)}
								</span>
							</div>
							<p>{message.obsah}</p>
						</div>
					))}
				</div>
				<div className={styles.inputarea}>
					<form onSubmit={handleSubmit}>
						<input
							value={jmeno}
							onChange={(e) => setJmeno(e.target.value)}
							placeholder="Jméno"
							type="text"
						/>
						<textarea
							value={zprava}
							onChange={(e) => setZprava(e.target.value)}
							placeholder="Zpráva..."
						/>
						<button type="submit">Odeslat zprávu</button>
					</form>
				</div>
			</div>
		</section>
	);
}

// function formatovatDatum(inputString) {
// 	const date = new Date(inputString);
// 	const hour = date.getUTCHours().toString().padStart(2, '0');
// 	const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// 	const day = date.getUTCDate().toString().padStart(2, '0');
// 	const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed, so add 1
// 	const year = date.getUTCFullYear().toString();
// 	return `${hour}:${minutes} ${day}.${month}.${year}`;
// }
function formatovatDatum(inputString) {
	const date = new Date(inputString);
	const today = new Date();

	if (
		date.getUTCDate() === today.getUTCDate() &&
		date.getUTCMonth() === today.getUTCMonth()
	) {
		const hour = date.getUTCHours().toString().padStart(2, '0');
		const minutes = date.getUTCMinutes().toString().padStart(2, '0');
		return `${hour}:${minutes}`;
	}

	const hour = date.getUTCHours().toString().padStart(2, '0');
	const minutes = date.getUTCMinutes().toString().padStart(2, '0');
	const day = date.getUTCDate().toString().padStart(2, '0');
	const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed, so add 1
	const year = date.getUTCFullYear().toString();
	return `${hour}:${minutes} ${day}.${month}.${year}`;
}
