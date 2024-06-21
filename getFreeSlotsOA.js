class Schedule {
    get test() {
        console.log(this._formatFreeSlots(this._getFreeSlots(this._targetBusySlots(this._splitWorkingHoursToFiveMinSlots(this._workingHours)))));
    }
    get workingHours() {
        if(Object.keys(this._workingHours).length) {
            return (
                {
                    start: this._formatHoursOutput(this._workingHours.start),
                    stop: this._formatHoursOutput(this._workingHours.stop),
                }
            )

        } else {
            console.warn(`No working hours were set yet. Please set working hours using "workingHours" property`);
            return null;
        } 
    };
    set workingHours(workingHours){
        try{
            if(this._hoursCheck(workingHours)){
                this._workingHours = this._hoursNormalize(workingHours);
                console.log("Working hours were successfully set.")
            } else {
                throw new Error('An error has occurred while trying to set working hours. Please, make sure you pass an object of the format {start: "00:00", stop: "00:00"}')
            }
        }catch(err) {
            console.error(err.message);
        }
    };
    get busyPeriods() {
        if(this._busyPeriods.length) {
            return this._busyPeriods.map((period)=> {
                return ({
                    start: this._formatHoursOutput(period.start),
                    stop: this._formatHoursOutput(period.stop),
                })
            })
        } else {
            console.warn(`No busy periods were set yet. Please set busy periods using "busyPeriods" property`);
            return null;
        }

    };
    set busyPeriods(periods){
        try{
            const lenBefore = this._busyPeriods.length;
            const checkedPeriods = this._getCheckedBusyPeriods(periods);
            if(checkedPeriods.passed.length > 0) {
                this._busyPeriods = checkedPeriods.passed.map((period)=> {
                    return this._hoursNormalize(period)
                })

            } else {
                throw new Error('An error occurred while trying to set busy periods. No busy period qualified creteria. Please, make sure you pass an array of objects of the format {start: "00:00", stop: "00:00"} +- 5mins.')
            }
            const lenAfter = this._busyPeriods.length;
            console.warn(`${lenAfter - lenBefore} ${lenAfter - lenBefore !== 1 ? 'periods were':'period was'} successfully set. ${checkedPeriods.failed.length > 0 ? checkedPeriods.failed.length + ' did not qualify.' : ''}`);
            checkedPeriods.failed.length > 0 && console.table(checkedPeriods.failed);
        } catch(err){
            console.error(err.message);
        }
    };
    get freePeriods() {
        if(this._freePeriods.length) {
            return this._freePeriods;
        } else {
            console.warn(`No free periods in the schedule yet. Please make sure to set both working periods and busy periods.`);
            return null;
        }
    };
    _freePeriods = [];
    constructor(workingHours={}, busyPeriods=[]) {
        this._id = Date.now();
        if(this._hoursCheck(workingHours) && Array.isArray(busyPeriods)){
            this._workingHours = this._hoursNormalize(workingHours);
            this._busyPeriods = busyPeriods;
        } else {
            this._workingHours = {};
            this._busyPeriods = [];
        }
    };
    _hoursCheck(hours) {
        if(Object.prototype.toString.call(hours) === '[object Object]'
           && Object.keys(hours).length === 2
           && Object.keys(hours).includes('start')
           && Object.keys(hours).includes('stop')
           && Object.values(hours).every((value)=> typeof value === 'string')
           && Object.values(hours).every((value)=> value.search(/^([0-1]?[0-9]|2[0-3]):[0-5][05]?$/) !== -1)) {
            return true;
        } else return false;
    };
    _hoursNormalize(hours) {
        return Object.entries(hours).reduce((result, entry)=>{
            const value = entry[1].split(':');
            return {
                ...result,
                [entry[0]]: value.map((part)=> part.padStart(2,0))
            }
        }, {})
    };
    _getCheckedBusyPeriods(periods) {
        if(!Array.isArray(periods) || periods.length <= 0) {
            throw new Error('Invalid busy periods. Please, make sure you pass a non-empty array of objects of the format {start: "00:00", stop: "00:00} +- 5mins.')
        }
        const result = {passed:[], failed:[]};
        periods.forEach((period, index)=>{
            if(this._hoursCheck(period)) {
                result.passed.push(period);
            } else {
                result.failed.push(Object.assign(period, {position: index}));
            }
        });
        return result
    };
    _formatHoursOutput(time) {
        return time.join(':');
    };
    _splitWorkingHoursToFiveMinSlots(workingHours) {
        const fiveMinuteSlots = [];
        const pushSlot = (hour, minute) => {
            fiveMinuteSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
        const startHours = Number(workingHours.start[0]),
              startMinutes = Number(workingHours.start[1]);
        const stopHours = Number(workingHours.stop[0]),
              stopMinutes = Number(workingHours.stop[1]);
        //work day hours
        if(startHours <= stopHours) {
            for(let i = startHours; i <= stopHours; i+=1) {
                if((i === startHours && startMinutes !== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(i, j);
                    }
                } else if(i === stopHours) {
                    for(let j = 0; j <= stopMinutes; j+=5) {
                        pushSlot(i, j);
                    }
                } else {
                    for(let j = 0; j <= 55; j+=5) {
                        pushSlot(i, j);
                    }
                    
                }
    
            }
        } else {
            //work night hours
            const hoursArray = [];
            for(let i = startHours; i <= 23; i+=1) {
                hoursArray.push(i);
            }
            for(let i = 0; i <= stopHours; i+=1) {
                hoursArray.push(i);
            }

            hoursArray.forEach((hour)=> {
                if((hour === startHours && startMinutes!== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(hour, j);
                    }
                } else if(hour === stopHours) {
                    for(let j = 0; j <= stopMinutes; j+=5) {
                        pushSlot(hour, j);
                    }
                } else {
                    for(let j = 0; j <= 55; j+=5) {
                        pushSlot(hour, j);
                    }
                    
                }
            })
        }
        return fiveMinuteSlots
    };
    _targetBusySlots(fiveMinuteSlots){
        const slotsWithTargets = fiveMinuteSlots.map((slot)=> {
            let isBusy = false;

            this._busyPeriods.forEach((busyPeriod) => {
                if (slot >= this._formatHoursOutput(busyPeriod.start) && slot < this._formatHoursOutput(busyPeriod.stop)) {
                    isBusy = true;
                }
            });
            if (!isBusy) {
                return slot;
            }
        });
        return slotsWithTargets;
    };
    _getFreeSlots(slotsWithTargets){
        // we need 30minute slots
        const thirtyMinuteSlots = [];
        let slot = [];
        let slotStartIndex = 0;
        let slotEndIndex = 6;

        slotsWithTargets.forEach((currSlot, index)=>{
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
        return thirtyMinuteSlots;   
    };
    _formatFreeSlots(freeSlots) {
        return freeSlots.reduce((result, slotArr)=> {
            return [
                ...result,
                {start: slotArr[0], end: slotArr[slotArr.length -1]}
            ]
        },[]);
    }

} 

const schedule = new Schedule();
schedule.workingHours = {start: "00:00", stop: "03:30"};
schedule.busyPeriods = [{start: "00:00", stop: "00:25"}, {start: "00:55", stop: "01:15"}, {start:"02:05", stop: "03:00"}]
schedule.test