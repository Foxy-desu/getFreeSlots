const workingHours = {start: 9, stop: 21};
const busy = [
    {'start' : '10:30',
    'stop' : '10:50'
    },
    {'start' : '18:40',
    'stop' : '18:50'
    },
    {'start' : '14:40',
    'stop' : '15:50'
    },
    {'start' : '16:40',
    'stop' : '17:20'
    },
    {'start' : '20:05',
    'stop' : '20:20'
    }
];

function getFreeSlots(workingHours, busyPeriods) {
    
    function splitHoursToFiveMinuteSlots(hours){
        const slotsPerHour = 12; // 60min / 5min = 12
        const fiveMinuteSlots = [];

        for (let i = hours.start; i <= hours.stop; i++) {
            if (i === hours.stop) {
                const slot = `${i}:00`;
                fiveMinuteSlots.push(slot);
            } else {
                for (let j = 0; j < slotsPerHour; j++) {
                    const minutes = (j * 5).toString().padStart(2, '0');
                    const slot = `${i}:${minutes}`;
                
                    fiveMinuteSlots.push(slot);
                }
            }
        };
        return fiveMinuteSlots;
    };

    function findFreeFiveMinuteSlots(fiveMinuteSlots, busyPeriods) {
        const freeFiveMinuteSlots = fiveMinuteSlots.map((slot)=> {
            let isBusy = false;

            busyPeriods.forEach((busyPeriod) => {
                if (slot >= busyPeriod.start && slot < busyPeriod.stop) {
                    isBusy = true;
                }
            });
            if (!isBusy) {
                return slot;
            }
        });

        return freeFiveMinuteSlots;
    };

    function collectThirtyMinutesFreeSlots(freeFiveMinuteSlots) {
        const thirtyMinuteSlots = [];
        let slot = [];
        let slotStartIndex = 0;
        let slotEndIndex = 6;

        freeFiveMinuteSlots.forEach((currSlot, index)=>{
            if(!currSlot) {
                slotStartIndex = index + 1;
                slotEndIndex = slotStartIndex + 6;
                slot = [];
            }
            if (index === slotEndIndex && currSlot) {
                slot.push(currSlot);
                slot.length === 7 && thirtyMinuteSlots.push(slot);
                slotStartIndex = slotEndIndex;
                slotEndIndex = slotStartIndex + 6;
                slot = [];
            }
            if (index < slotEndIndex && currSlot) {
                slot.push(currSlot);
            }
            
        });

        const freeSlots = thirtyMinuteSlots.reduce((result, slotArr)=> {
            return [
                ...result,
                {start: slotArr[0], end: slotArr[slotArr.length -1]}
            ]
        },[]);

        return freeSlots;
    };

    const smlSlots = splitHoursToFiveMinuteSlots(workingHours);
    const freeSmlSlots = findFreeFiveMinuteSlots(smlSlots, busyPeriods);
    const result = collectThirtyMinutesFreeSlots(freeSmlSlots);
    return result;
}

getFreeSlots(workingHours, busy);

