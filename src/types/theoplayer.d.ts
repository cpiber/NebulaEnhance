import v from 'video.js';

declare namespace THEOplayer {
    const videojs: typeof v;

    class Player extends ChromelessPlayer {
        constructor​(element: HTMLElement, configuration?: UIPlayerConfiguration);
        controls: boolean;
        presentationMode?: PresentationMode;
        readonly related?: UIRelatedContent;
        readonly social?: SocialSharing;
        readonly ui: v.Player;
        readonly upnext?: UpNextManager;
        paused: boolean;
        pause(): void;
        play(): void;
    }
    // only partially declared
    class ChromelessPlayer {
        constructor(element: HTMLElement, configuration?: PlayerConfiguration);
        autoplay: boolean;
        currentTime: number;
        duration: number;
        element: HTMLElement;
        playbackRate: number;
        readyState: number;
        videoTracks: MediaTrackList;
        textTracks: TextTracksList;
        volume: number;

        addEventListener<TType extends StringKeyOf<PlayerEventMap>>(type: TType | TType[], listener: EventListener<PlayerEventMap[TType]>): void;
        removeEventListener<TType extends StringKeyOf<PlayerEventMap>>(type: TType | TType[], listener: EventListener<PlayerEventMap[TType]>): void;
    }


    interface MediaTrackList extends TrackList<MediaTrack> {
        readonly length: number;
        item(index: number): MediaTrack;
    }
    interface TrackList<TTrack extends Track> extends ReadonlyArray<TTrack>, EventDispatcher<TrackListEventMap>  {
        readonly length: number;
        item(index: number): TTrack;
    }
    interface MediaTrack extends Track, EventDispatcher<MediaTrackEventMap>  {
        readonly activeQuality: Quality | undefined;
        enabled: boolean;
        readonly id: string;
        readonly kind: string;
        label: string;
        readonly language: string;
        readonly qualities: QualityList;
        targetQuality: Quality | Quality[] | undefined;
        readonly uid: number;
        addEventListener<TType extends StringKeyOf<MediaTrackEventMap>>(type: TType | TType[], listener: EventListener<MediaTrackEventMap[TType]>): void;
        removeEventListener<TType extends StringKeyOf<MediaTrackEventMap>>(type: TType | TType[], listener: EventListener<MediaTrackEventMap[TType]>): void;
    }
    interface Track extends EventDispatcher<TrackEventMap> {
        id: string;
        kind: string;
        label: string;
        language: string;
        uid: number;
    }


    interface TextTrackCueList extends ReadonlyArray<TextTrackCue> {
        readonly length: number;
        item(index: number): TextTrackCue;
    }
    type TextTrackReadyState = 0 | 1 | 2 | 3;
    type TextTrackType = 'srt' | 'ttml' | 'webvtt' | 'emsg' | 'eventstream' | 'id3' | 'cea608' | 'daterange' | '';
    interface TextTrack extends /*Track,*/ EventDispatcher<TextTrackEventMap>  {
        readonly activeCues: TextTrackCueList | null;
        readonly cues: TextTrackCueList | null;
	    readonly id: string;
	    readonly inBandMetadataTrackDispatchType: string;
	    readonly kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
	    label: string;
	    readonly language: string;
	    mode: 'disabled' | 'hidden' | 'showing';
	    readonly readyState: TextTrackReadyState;
	    readonly src: string;
	    readonly type: TextTrackType;
        readonly uid: number;
    }
    interface TextTracksList extends TrackList<TextTrack> {
        readonly length: number;
        item(index: number): TextTrack;
    }

    /**
     * events
     */
    interface EventDispatcher<TEventMap extends EventMap<StringKeyOf<TEventMap>>> {
        addEventListener<TType extends StringKeyOf<TEventMap>>(type: TType | TType[], listener: EventListener<TEventMap[TType]>): void;
        removeEventListener<TType extends StringKeyOf<TEventMap>>(type: TType | TType[], listener: EventListener<TEventMap[TType]>): void;
    }

    interface Event<TType extends string = string> {
        date: Date;
        type: TType;
    }

    interface QualityEvent<TType extends string> extends Event<TType> {
        readonly quality: Quality;
    }
    interface TargetQualityChangedEvent extends Event<'targetqualitychanged'> {
        readonly qualities: Quality[];
        readonly quality: Quality | undefined;
    }

    interface TrackEventMap {
        change: Event<'change'>;
        update: Event<'update'>;
    }

    interface MediaTrackEventMap extends TrackEventMap {
        activequalitychanged: QualityEvent<'activequalitychanged'>;
        qualityunavailable: QualityEvent<'qualityunavailable'>;
        targetqualitychanged: TargetQualityChangedEvent;
    }

    interface TrackListEventMap {
        addtrack: Event<'addtrack'>;
        change: Event<'change'>;
        removetrack: Event<'removetrack'>;
    }

    interface TextTrackEventMap extends TrackEventMap {
        addcue: Event<'addcue'>;
	    cuechange: Event<'cuechange'>;
	    entercue: Event<'entercue'>;
	    error: TextTrackErrorEvent;
	    exitcue: Event<'exitcue'>;
	    readystatechange: Event<'readystatechange'>;
	    removecue: Event<'removecue'>;
	    typechange: Event<'typechange'>;
    }
    
    interface UpdateQualityEvent extends Event<'update'> {
        readonly quality: Quality;
    }

    interface QualityEventMap {
        update: UpdateQualityEvent;
    }

    // only partially declared
    interface PlayerEventMap {
        playing: Event<'playing'>;
        ratechange: Event<'ratechange'>;
        readystatechange: Event<'readystatechange'>;
        volumechange: Event<'volumechange'>;
    }
    
    /**
     * misc
     */
    interface Quality extends EventDispatcher<QualityEventMap> {
        readonly available: boolean;
        readonly averageBandwidth?: number;
        readonly bandwidth: number;
        readonly codecs: string;
        readonly id: number;
        label: string;
        readonly name: string;
        
        // unofficial?
        readonly height: number;
        readonly width: number;
    }
    
    interface QualityList extends Array<Quality> {
        item(index: number): Quality;
    }
    
    /**
     * types
     */
    type PresentationMode = 'inline' | 'fullscreen' | 'picture-in-picture';
    type EventMap<TType extends string> = {
        [type in TType]: Event;
    };
    type StringKeyOf<T> = Extract<keyof T, string>;
    type EventListener<TEvent extends Event> = (event: TEvent) => void;
    
    /**
     * stubs
     */
    interface PlayerConfiguration {}
    interface UIPlayerConfiguration extends PlayerConfiguration {}
    interface UIRelatedContent {}
    interface SocialSharing {}
    interface UpNextManager {}
    interface ErrorEvent extends Event<'error'> {}
    interface TextTrackErrorEvent extends ErrorEvent {}
}