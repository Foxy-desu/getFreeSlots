const workingHours = {start: '9:00', stop: '21:00'};
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

class Schedule {

    constructor(workHours={}, busy=[]){
        this._id = this._generateID();
        this._initiateSchedule(workHours, busy)
    };
    _generateID(){
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    };
    _initiateSchedule(workHours, busy){
        // check passed data and initialize variables (for constructor method only).
        if(this._checkTimeFrame(workHours)){
            this._workHours = workHours;
        } else this._workHours = {};

        if(this._checkTimeList(busy)){
            this._busy = busy;
        }else {
            this._busy = [];
        };
    }
    _checkTimeFrame(timeFrame){
        //checks if passed data is an object of the type {start: "00:00, stop: "00:00"} or {start: "0:0", stop: "0:0"};
        if(
            Object.prototype.toString.call(timeFrame) === '[object Object]'
            && Object.keys(timeFrame).length === 2
            && Object.keys(timeFrame).includes('start')
            && Object.keys(timeFrame).includes('stop')
            && Object.values(timeFrame).every((value)=> {
                return (
                    typeof value ==='string'
                    && value.search(/^([0-1]?[0-9]|2[0-3]):[0-5][05]?$/)!== -1
                );
            })  
        ) return true;
        return false;
    };
    _checkTimeList(timeList){
         //checks if passed data is a non-empty array
         //as array may contain both right and wrong values,
         //checking of each item is not included in this method
         if(Array.isArray(timeList) || timeList.length > 0) {
            return true
        }
        return false;
    };
};

const schedule = new Schedule(workingHours, workingHours);
console.log(schedule._workHours);
console.log(schedule._busy);
