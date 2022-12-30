const getSubscriptions = () => {
	const subscriptions = {} as {
		[key: symbol]:
			| undefined
			| {
					[valueKey: symbol]: any
					value: () => any
					setValue: (value: any) => void
					unsubscribe: () => void
			  }
	}
	const subscribe = <TValue>(
		initialValue: TValue | (() => TValue),
		onChange: (value: TValue) => void
	): {
		value: () => TValue
		setValue: (value: TValue | ((currentValue: TValue) => TValue)) => void
		unsubscribe: () => void
	} => {
		const key = Symbol('subscription key')
		const valueKey = Symbol('subscription value key')
		const subscription = {
			[valueKey]:
				typeof initialValue === 'function'
					? (initialValue as any)()
					: initialValue,
			value: () => {
				const sub = subscriptions[key]
				if (sub) {
					return sub[valueKey]
				}
				console.error(
					'Trying to read value after unsubscribing from it'
				)
			},
			setValue: (update: TValue | ((current: TValue) => TValue)) => {
				const sub = subscriptions[key]
				if (sub) {
					const newValue =
						typeof update === 'function'
							? (update as any)(sub[valueKey])
							: update
					const prevValue = sub[valueKey]
					if (prevValue !== newValue) {
						sub[valueKey] = newValue
						onChange(newValue)
						return
					}
					return
				}
				console.error('Trying to set value after unsubscribing from it')
			},
			unsubscribe: () => {
				subscriptions[key] = undefined
			},
		}
		subscriptions[key] = subscription
		return subscription
	}

	return subscribe
}

export const subscribe = getSubscriptions()
