#!/usr/bin/perl -w

use strict;
use Data::Dumper;
use Date::Manip;
use XML::LibXML;
use GPS::Point;
use JSON;
use utf8;

#               100km/h
my $max_speed = 100*1000/(60*60); # m/s

binmode STDOUT, ":utf8";
binmode STDERR, ":utf8";

sub coord2float {
    my $coord = shift;

    #14°25'26.25"
    #49°11'58.67N
    #49°56'19.77"N
    #if ($coord =~ /^(\d+)\°(\d+)\'([0-9\.]+)/) {
    if ($coord =~ /^\s*(\d+)(\°|�)\s*(\d+)('|´|’)\s*([0-9\.]+)/) {
	my $dec = $1;
	my $min = $3;
	my $sec = $5;

	return ($dec + ($min+$sec/60)/60);
    } else {
	die "Failed to parse '$coord'\n";
    };
};

sub get_locations {
    my $inst = shift;
    my @loc;

    my $sum_lat = 0;
    my $sum_long = 0;
    my $sum_cnt = 0;

    foreach my $loc ($inst->getElementsByTagName('location')) {
	my $lat = $loc->getElementsByTagName('latitude')->[0]->textContent;
	my $long = $loc->getElementsByTagName('longitude')->[0]->textContent;

	my $lat_f = coord2float($lat);
	my $long_f = coord2float($long);

	my $point = GPS::Point->new(lat => $lat_f, lon => $long_f);

	push @loc, {raw => "$lat $long",
		    float => [$lat_f, $long_f],
		    point => $point };

	$sum_lat += $lat_f;
	$sum_long += $long_f;
	$sum_cnt++;
    };

    my $point = GPS::Point->new(lat => $sum_lat/$sum_cnt,
				lon => $sum_long/$sum_cnt); 
    
    return {
	locations => \@loc,
	centre => { point => $point,
		    float => [ $sum_lat/$sum_cnt,
			       $sum_long/$sum_cnt ]}
    };
};

sub calc_distances {
    my $loc = shift;

    my $cp = $loc->{centre}->{point};

    my $min = undef;
    my $max = undef;
    foreach my $l (@{$loc->{locations}}) {
	my $lp = $l->{point};
        my $dist = $lp->distance($cp);
	$l->{dist} = $dist;

	$min = $dist unless ($min);
	$min = $dist if ($dist < $min);

	$max = $dist unless ($max);
	$max = $dist if ($dist > $max);
    };

    $loc->{centre}->{min} = $min;
    $loc->{centre}->{max} = $max;
};

sub calc_min_dist {
    my $l1 = shift;
    my $l2 = shift;
    my $dist;

    foreach my $a (@{$l1}) {
	foreach my $b (@{$l2}) {
	    my $d = $a->{point}->distance($b->{point});
	    $dist = $d if ((not defined($dist)) or ($dist > $d));
	};
    };

    return $dist;
};

my $parser = XML::LibXML->new;
open(F, '<institution.xml') or 
    die(sprintf('Failed to open file %s: %s',
		'institution.xml', $!));
binmode F, ":utf8";
my $str = join('', <F>);
close(F);

my $doc;
eval {
  $doc = $parser->parse_string($str);
};
if ($@) {
  die($@);
};

my %institutions;

# spocitani vzdalenosti mezi body insituce
foreach my $institution ($doc->getElementsByTagName('institution')) {
    my $inst_realm = $institution->getElementsByTagName('inst_realm')->[0]->textContent;

    $institutions{$inst_realm} = get_locations($institution);
#    calc_distances($institutions{$inst_realm});
};

#die Dumper(\%institutions);

my %dist;
my @dist;
for my $ir1 (sort keys %institutions) {
    warn "Working on $ir1";
    my @institutions;
    for my $ir2 (sort keys %institutions) {
	my $dist = calc_min_dist($institutions{$ir1}->{locations},
				 $institutions{$ir2}->{locations});
	my $time = $dist/$max_speed;

	push @institutions, { 'institution' => $ir2,
			      'dist' => $dist,
			      'time' => $time };
    };

    push @dist, { 'institution' => $ir1,
		  'institutions' => \@institutions };

    #last if (scalar(@dist) > 1);
};

my %export = ( revision => UnixDate(ParseDate('now'), '%Y%m%d%H%M%S'),
	       data => \@dist );

my $json = encode_json \%export;

open(JSON, ">inst.json");
print JSON $json;
close(JSON);

# tidy json: python -mjson.tool
